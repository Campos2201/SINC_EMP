import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") {
  globalForPrisma.prisma = prisma;
}

async function getUserIdFromToken(req: NextRequest): Promise<number | null> {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const secretValue = process.env.JWT_SECRET;
    if (!token || !secretValue) return null;

    const secret = new TextEncoder().encode(secretValue);
    const { payload } = await jwtVerify(token, secret);
    return payload.id as number;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    // Parâmetros da query
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo') || 'remessas';
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const ordenarPor = searchParams.get('ordenarPor') || 'data_desc';

    // Monta filtros de data
    const dataFilter: any = {};
    if (dataInicio) dataFilter.gte = new Date(dataInicio);
    if (dataFim) {
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);
      dataFilter.lte = fim;
    }

    let resultado: any = null;

    if (tipo === 'remessas') {
      resultado = await gerarRelatórioRemessas(prisma, userId, dataFilter, ordenarPor);
    } else {
      return NextResponse.json({ message: "Tipo de relatório inválido" }, { status: 400 });
    }

    return NextResponse.json(resultado, { status: 200 });
  } catch (err: any) {
    console.error("API /api/relatorios GET error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}

async function gerarRelatórioRemessas(
  prisma: any,
  userId: number,
  dataFilter: any,
  ordenarPor?: string
) {
  const remessas = await prisma.remessa.findMany({
    where: {
      userId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      movimentacoes: Object.keys(dataFilter).length > 0 ? {
        where: {
          createdAt: dataFilter
        }
      } : true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const dadosFormatados = remessas.flatMap((remessa: any) =>
    remessa.movimentacoes.map((movimentacao: any) => ({
      id: movimentacao.id,
      remessaId: remessa.id,
      cliente: remessa.user?.name || 'Cliente não informado',
      email: remessa.user?.email || '-',
      mes: remessa.mes,
      ano: remessa.ano,
      status: remessa.status,
      dataMovimentacao: new Date(movimentacao.createdAt).toLocaleDateString('pt-BR'),
      dataMovimentacaoData: movimentacao.createdAt,
      descricao: movimentacao.descricao,
      tipo: movimentacao.tipo,
      valor: Number(movimentacao.valor || 0).toFixed(2)
    }))
  );

  const totalEntradas = dadosFormatados.reduce((acc: number, item: any) => item.tipo === 'ENTRADA' ? acc + Number(item.valor || 0) : acc, 0);
  const totalSaidas = dadosFormatados.reduce((acc: number, item: any) => item.tipo === 'SAIDA' ? acc + Number(item.valor || 0) : acc, 0);

  const dadosOrdenados = aplicarOrdenacao(dadosFormatados, ordenarPor || 'data_desc', ['valor']);

  return {
    dados: dadosOrdenados,
    resumo: {
      totalMovimentacoes: dadosOrdenados.length,
      totalEntradas: totalEntradas.toFixed(2),
      totalSaidas: totalSaidas.toFixed(2),
      saldoTotal: (totalEntradas - totalSaidas).toFixed(2)
    }
  };
}

function aplicarOrdenacao(dados: any[], ordenarPor: string, camposNumericos: string[]): any[] {
  const copias = [...dados];

  const ordenadores: Record<string, (a: any, b: any) => number> = {
    data_desc: (a, b) => new Date(b.dataMovimentacaoData || 0).getTime() - new Date(a.dataMovimentacaoData || 0).getTime(),
    data_asc: (a, b) => new Date(a.dataMovimentacaoData || 0).getTime() - new Date(b.dataMovimentacaoData || 0).getTime(),
    valor_desc: (a, b) => parseFloat(b.valor || 0) - parseFloat(a.valor || 0),
    valor_asc: (a, b) => parseFloat(a.valor || 0) - parseFloat(b.valor || 0),
    nome_asc: (a, b) => (a.cliente || '').localeCompare(b.cliente || '')
  };

  const comparador = ordenadores[ordenarPor] || ordenadores.data_desc;
  return copias.sort(comparador);
}
