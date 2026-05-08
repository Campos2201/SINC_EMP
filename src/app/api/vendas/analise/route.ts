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
    const mod = await import("../../../../generated/prisma");
    const { PrismaClient } = mod as { PrismaClient: any };

    const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
    g.prisma = g.prisma || new PrismaClient();
    const prisma = g.prisma;

    // Parâmetros da query
    const { searchParams } = new URL(req.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const tipoGrafico = searchParams.get('tipoGrafico') || 'linha';
    const metricas = (searchParams.get('metricas') || 'valor').split(',');
    const agrupadoPor = searchParams.get('agrupadoPor') || 'data';

    // Monta filtros de data corretamente (usando parseLocalDate)
    const dataFilter: any = {};
    if (dataInicio) {
      const inicioDate = parseLocalDate(dataInicio);
      if (inicioDate) {
        inicioDate.setHours(0, 0, 0, 0);
        dataFilter.gte = inicioDate;
      }
    }
    if (dataFim) {
      const fimDate = parseLocalDate(dataFim);
      if (fimDate) {
        fimDate.setHours(23, 59, 59, 999);
        dataFilter.lte = fimDate;
      }
    }

    // Busca vendas com lotes (incluindo gasto_alimentacao)
    const vendas = await prisma.venda.findMany({
      include: {
        Lote: {
          select: {
            id: true,
            codigo: true,
            custo: true,
            gasto_alimentacao: true
          }
        }
      },
      where: {
        dataVenda: Object.keys(dataFilter).length > 0 ? dataFilter : undefined
      },
      orderBy: {
        dataVenda: 'asc'
      }
    });

    // Processa dados para gráfico
    const dadosGrafico = agruparDados(vendas, agrupadoPor, metricas);

    // Processa dados para tabela
    const dadosTabela = gerarTabelaVendas(vendas, metricas);

    // Calcula resumo estatístico
    const resumo = calcularResumo(vendas, metricas);

    return NextResponse.json({
      grafico: dadosGrafico,
      tabela: dadosTabela,
      resumo
    }, { status: 200 });
  } catch (err: any) {
    console.error("API /api/vendas/analise GET error:", err);
    return NextResponse.json(
      { message: err?.message || "Erro no servidor" },
      { status: 500 }
    );
  }
}

function agruparDados(
  vendas: any[],
  agrupadoPor: string,
  metricas: string[]
): any[] {
  const grupos: Record<string, any> = {};

  vendas.forEach((venda: any) => {
    let chave: string;
    const dataVenda = new Date(venda.dataVenda);

    switch (agrupadoPor) {
      case 'lote':
        chave = venda.Lote.codigo;
        break;
      case 'mes':
        chave = `${dataVenda.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit' })}`;
        break;
      case 'semana':
        const inicioSemana = new Date(dataVenda);
        inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
        chave = inicioSemana.toLocaleDateString('pt-BR');
        break;
      case 'data':
      default:
        chave = dataVenda.toLocaleDateString('pt-BR');
        break;
    }

    if (!grupos[chave]) {
      grupos[chave] = {
        nome: chave,
        valor: 0,
        quantidade: 0,
        lucro: 0,
        margemTotal: 0,
        count: 0
      };
    }

  const valorNum = Number(venda.valor);
  const loteCusto = Number(venda.Lote.custo || 0);
  const loteGasto = Number(venda.Lote.gasto_alimentacao || 0);
  const custoTotal = loteCusto + loteGasto;
  const lucro = valorNum - custoTotal;
  const margem = custoTotal > 0 ? ((lucro / custoTotal) * 100) : 0;

  grupos[chave].valor += valorNum;
  grupos[chave].quantidade += 1;
  grupos[chave].lucro += lucro;
  grupos[chave].margemTotal += margem;
    grupos[chave].count += 1;
  });

  // Calcula margem média
  return Object.values(grupos).map((grupo: any) => ({
    ...grupo,
    margem: grupo.count > 0 ? grupo.margemTotal / grupo.count : 0,
    margemTotal: undefined,
    count: undefined
  }));
}

function gerarTabelaVendas(vendas: any[], metricas: string[]): any[] {
  return vendas.map((venda: any) => {
  const valorNum = Number(venda.valor);
  const loteCusto = Number(venda.Lote.custo || 0);
  const loteGasto = Number(venda.Lote.gasto_alimentacao || 0);
  const custoTotal = loteCusto + loteGasto;
  const lucro = valorNum - custoTotal;
  const margem = custoTotal > 0 ? ((lucro / custoTotal) * 100) : 0;

    const linha: any = {
      id: venda.id,
      data: new Date(venda.dataVenda).toLocaleDateString('pt-BR'),
      lote: venda.Lote.codigo
    };

    if (metricas.includes('valor')) {
      linha.valor = venda.valor;
    }
    if (metricas.includes('quantidade')) {
      linha.quantidade = 1;
    }
    if (metricas.includes('lucro')) {
      linha.lucro = lucro;
    }
    if (metricas.includes('margem')) {
      linha.margem = margem;
    }

    return linha;
  });
}

function calcularResumo(vendas: any[], metricas: string[]): Record<string, any> {
  const resumo: Record<string, any> = {};

  const totalVendas = vendas.length;
  resumo.totalVendas = totalVendas;

  if (metricas.includes('valor')) {
    const valorTotal = vendas.reduce((acc: number, v: any) => acc + v.valor, 0);
    resumo.valorTotal = valorTotal;
    resumo.valorMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;
  }

  if (metricas.includes('quantidade')) {
    resumo.quantidadeVendas = totalVendas;
  }

  if (metricas.includes('lucro')) {
    const lucroTotal = vendas.reduce((acc: number, v: any) => {
      const valorNum = Number(v.valor);
      const loteCusto = Number(v.Lote.custo || 0);
      const loteGasto = Number(v.Lote.gasto_alimentacao || 0);
      const custoTotal = loteCusto + loteGasto;
      const lucroItem = valorNum - custoTotal;
      return acc + (Number.isFinite(lucroItem) ? lucroItem : 0);
    }, 0);
    resumo.lucroTotal = lucroTotal;
    resumo.lucroMedio = totalVendas > 0 ? lucroTotal / totalVendas : 0;
  }

  if (metricas.includes('margem')) {
    const margens = vendas.map((v: any) => {
      const valorNum = Number(v.valor);
      const loteCusto = Number(v.Lote.custo || 0);
      const loteGasto = Number(v.Lote.gasto_alimentacao || 0);
      const custoTotal = loteCusto + loteGasto;
      const lucro = valorNum - custoTotal;
      return custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;
    });
    const margemMedia = margens.length > 0 ? margens.reduce((a: number, b: number) => a + b, 0) / margens.length : 0;
    resumo.margemMedia = margemMedia;
  }

  return resumo;
}
