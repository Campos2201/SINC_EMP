import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseLocalDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d); // cria no fuso local
}

export async function GET(req: NextRequest) {
  try {
    // importa o Prisma Client dinamicamente
    const mod = await import("../../../generated/prisma");
    const { PrismaClient } = mod as { PrismaClient: any };

    // singleton para hot-reload em dev
    const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
    g.prisma = g.prisma || new PrismaClient();
    const prisma = g.prisma;

    // Buscar todas as vendas com informações do lote
    const vendas = await prisma.venda.findMany({
      include: {
        Lote: {
          select: {
            id: true,
            codigo: true,
            chegada: true,
            custo: true,
            gasto_alimentacao: true,
            vacinado: true,
            data_vacinacao: true,
            _count: {
              select: {
                bois: true
              }
            }
          }
        }
      },
      orderBy: {
        dataVenda: 'desc'
      }
    });

    // Formatar resposta
    const vendasFormatadas = vendas.map((venda: any) => {
      const valorNum = Number(venda.valor);
      const loteCusto = Number(venda.Lote.custo || 0);
      const loteGasto = Number(venda.Lote.gasto_alimentacao || 0);
      const custoTotal = loteCusto + loteGasto;
      const lucroCalc = valorNum - custoTotal;
      const margem = custoTotal > 0 ? (lucroCalc / custoTotal * 100) : 0;

      return {
        id: venda.id,
        dataVenda: venda.dataVenda,
        valor: valorNum,
        loteId: venda.loteId,
        lote: {
          id: venda.Lote.id,
          codigo: venda.Lote.codigo,
          chegada: venda.Lote.chegada,
          custo: loteCusto,
          gasto_alimentacao: loteGasto,
          vacinado: venda.Lote.vacinado,
          quantidadeBois: venda.Lote._count.bois
        },
        lucro: lucroCalc,
        margemLucro: margem.toFixed(2)
      };
    });

    return NextResponse.json(vendasFormatadas, { status: 200 });
  } catch (err: any) {
    console.error("API /api/vendas GET error:", err);
    return NextResponse.json({ message: err?.message || "Erro ao buscar vendas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // importa o Prisma Client dinamicamente
    const mod = await import("../../../generated/prisma");
    const { PrismaClient } = mod as { PrismaClient: any };

    // singleton para hot-reload em dev
    const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
    g.prisma = g.prisma || new PrismaClient();
    const prisma = g.prisma;

    const body = await req.json();
    const { loteId, dataVenda, valor } = body || {};

    // Validações
    if (!loteId || !valor) {
      return NextResponse.json(
        { message: "Lote e valor são obrigatórios" },
        { status: 400 }
      );
    }

    if (valor <= 0) {
      return NextResponse.json(
        { message: "Valor deve ser maior que zero" },
        { status: 400 }
      );
    }

    // Verificar se lote existe
    const loteExistente = await prisma.lote.findUnique({
      where: { id: parseInt(loteId) },
      include: {
        _count: {
          select: {
            bois: true
          }
        }
      }
    });

    if (!loteExistente) {
      return NextResponse.json(
        { message: "Lote não encontrado" },
        { status: 404 }
      );
    }

    if (loteExistente.data_venda) {
      return NextResponse.json(
        { message: "Este lote já foi vendido" },
        { status: 400 }
      );
    }

    // Parse da data de venda (tratando timezone corretamente)
    let dataVendaDate: Date;
    if (dataVenda) {
      const parsedDate = parseLocalDate(dataVenda);
      if (!parsedDate) {
        return NextResponse.json(
          { message: "Data de venda inválida" },
          { status: 400 }
        );
      }
      
      // Validar que a data não seja futura
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas a data
      parsedDate.setHours(0, 0, 0, 0);
      
      if (parsedDate > hoje) {
        return NextResponse.json(
          { message: "Não é possível registrar venda com data futura" },
          { status: 400 }
        );
      }
      
      dataVendaDate = parsedDate;
    } else {
      // Se não informou data, usa a data atual
      dataVendaDate = new Date();
      dataVendaDate.setHours(0, 0, 0, 0);
    }

    // Criar venda
    const venda = await prisma.venda.create({
      data: {
        loteId: parseInt(loteId),
        dataVenda: dataVendaDate,
        valor: parseFloat(valor)
      }
    });

    // Atualizar data_venda do lote
    await prisma.lote.update({
      where: { id: parseInt(loteId) },
      data: {
        data_venda: dataVendaDate
      }
    });

    // Calcular custo total incluindo gasto de alimentação
    const custoTotal = Number(loteExistente.custo || 0) + Number(loteExistente.gasto_alimentacao || 0);
    const lucroCalc = venda.valor - custoTotal;
    const margemCalc = custoTotal > 0 ? (lucroCalc / custoTotal * 100) : 0;

    // Retornar venda com informações completas
    const vendaComDetalhes = {
      id: venda.id,
      dataVenda: venda.dataVenda,
      valor: venda.valor,
      loteId: venda.loteId,
      lote: {
        id: loteExistente.id,
        codigo: loteExistente.codigo,
        chegada: loteExistente.chegada,
        custo: Number(loteExistente.custo || 0),
        gasto_alimentacao: Number(loteExistente.gasto_alimentacao || 0),
        vacinado: loteExistente.vacinado,
        quantidadeBois: loteExistente._count.bois
      },
      lucro: lucroCalc,
      margemLucro: margemCalc.toFixed(2)
    };

    return NextResponse.json(
      {
        message: "Venda registrada com sucesso",
        venda: vendaComDetalhes
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("API /api/vendas POST error:", err);
    return NextResponse.json(
      { message: err?.message || "Erro ao registrar venda" },
      { status: 500 }
    );
  }
}
