import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const mod = await import("../../../generated/prisma");
    const { PrismaClient } = mod as { PrismaClient: any };

    const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
    g.prisma = g.prisma || new PrismaClient();
    const prisma = g.prisma;

    // Parâmetros da query
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo') || 'lotes';
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const minValor = searchParams.get('minValor') ? parseFloat(searchParams.get('minValor')!) : undefined;
    const maxValor = searchParams.get('maxValor') ? parseFloat(searchParams.get('maxValor')!) : undefined;
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

    if (tipo === 'lotes') {
      resultado = await gerarRelatórioLotes(prisma, dataFilter, minValor, maxValor, ordenarPor);
    } else if (tipo === 'vendas') {
      resultado = await gerarRelatórioVendas(prisma, dataFilter, minValor, maxValor, ordenarPor);
    } else if (tipo === 'lucro') {
      resultado = await gerarRelatórioLucro(prisma, dataFilter, minValor, maxValor, ordenarPor);
    } else if (tipo === 'analise-completa') {
      resultado = await gerarAnáliseCompleta(prisma, dataFilter, minValor, maxValor);
    }

    return NextResponse.json(resultado, { status: 200 });
  } catch (err: any) {
    console.error("API /api/relatorios GET error:", err);
    return NextResponse.json({ message: err?.message || "Erro no servidor" }, { status: 500 });
  }
}

async function gerarRelatórioLotes(
  prisma: any,
  dataFilter: any,
  minValor?: number,
  maxValor?: number,
  ordenarPor?: string
) {
  const lotes = await prisma.lote.findMany({
    include: {
      bois: true,
      _count: {
        select: { bois: true }
      }
    },
    where: {
      chegada: Object.keys(dataFilter).length > 0 ? dataFilter : undefined,
      custo: {
        gte: minValor,
        lte: maxValor
      }
    }
  });

  // Mapeia e formata dados
  const dadosFormatados = lotes.map((lote: any) => {
    const pesoTotal = lote.bois.reduce((acc: number, boi: any) => acc + boi.peso, 0);
    const pesoMedio = lote.bois.length > 0 ? pesoTotal / lote.bois.length : 0;

    return {
      id: lote.id,
      codigo: lote.codigo,
      dataChegada: new Date(lote.chegada).toLocaleDateString('pt-BR'),
      quantidadeBois: lote._count.bois,
      pesoTotal: pesoTotal.toFixed(2),
      pesoMedio: pesoMedio.toFixed(2),
      custo: lote.custo.toFixed(2),
      vacinado: lote.vacinado ? 'Sim' : 'Não',
      dataVenda: lote.data_venda ? new Date(lote.data_venda).toLocaleDateString('pt-BR') : 'Não vendido'
    };
  });

  // Ordena dados
  const dadosOrdenados = aplicarOrdenacao(dadosFormatados, ordenarPor || 'data_desc', ['dataChegada', 'custo']);

  return {
    dados: dadosOrdenados,
    resumo: {
      totalRegistros: dadosOrdenados.length,
      custoTotal: dadosFormatados.reduce((acc: number, item: any) => acc + parseFloat(item.custo), 0).toFixed(2),
      quantidadeTotal: dadosFormatados.reduce((acc: number, item: any) => acc + item.quantidadeBois, 0),
      pesoMedioGeral: (
        dadosFormatados.reduce((acc: number, item: any) => acc + parseFloat(item.pesoMedio), 0) / Math.max(dadosFormatados.length, 1)
      ).toFixed(2)
    }
  };
}

async function gerarRelatórioVendas(
  prisma: any,
  dataFilter: any,
  minValor?: number,
  maxValor?: number,
  ordenarPor?: string
) {
  const vendas = await prisma.venda.findMany({
    include: {
      Lote: {
        select: {
          codigo: true,
          custo: true,
          gasto_alimentacao: true
        }
      }
    },
    where: {
      dataVenda: Object.keys(dataFilter).length > 0 ? dataFilter : undefined,
      valor: {
        gte: minValor,
        lte: maxValor
      }
    }
  });

  const dadosFormatados = vendas.map((venda: any) => {
    const valorNum = Number(venda.valor);
    const loteCusto = Number(venda.Lote.custo || 0);
    const loteGasto = Number(venda.Lote.gasto_alimentacao || 0);
    const custoTotal = loteCusto + loteGasto;
    const lucro = valorNum - custoTotal;
    const margemLucro = custoTotal > 0 ? ((lucro / custoTotal) * 100).toFixed(2) : '0.00';

    return {
      id: venda.id,
      lote: venda.Lote.codigo,
      dataVenda: new Date(venda.dataVenda).toLocaleDateString('pt-BR'),
      valor: valorNum.toFixed(2),
      custoBoi: custoTotal.toFixed(2),
      lucro: lucro.toFixed(2),
      margemLucro: `${margemLucro}%`
    };
  });

  const dadosOrdenados = aplicarOrdenacao(dadosFormatados, ordenarPor || 'data_desc', ['dataVenda', 'valor']);

  return {
    dados: dadosOrdenados,
    resumo: {
      totalRegistros: dadosOrdenados.length,
      valorTotal: dadosFormatados.reduce((acc: number, item: any) => acc + parseFloat(item.valor), 0).toFixed(2),
      lucroTotal: dadosFormatados.reduce((acc: number, item: any) => acc + parseFloat(item.lucro), 0).toFixed(2),
      margemMédia: (
        dadosFormatados.reduce((acc: number, item: any) => acc + parseFloat(item.margemLucro), 0) / Math.max(dadosFormatados.length, 1)
      ).toFixed(2)
    }
  };
}

async function gerarRelatórioLucro(
  prisma: any,
  dataFilter: any,
  minValor?: number,
  maxValor?: number,
  ordenarPor?: string
) {
  const lotes = await prisma.lote.findMany({
    include: {
      vendas: true,
      bois: true
    }
  });

  const dadosFormatados = lotes.map((lote: any) => {
    const totalVendas = lote.vendas.reduce((acc: number, v: any) => acc + Number(v.valor || 0), 0);
    const loteCusto = Number(lote.custo || 0);
    const loteGasto = Number(lote.gasto_alimentacao || 0);
    const custoTotal = loteCusto + loteGasto;
    const lucroTotal = totalVendas - custoTotal;
    const margemLucro = custoTotal > 0 ? ((lucroTotal / custoTotal) * 100).toFixed(2) : '0.00';
    const lucroPorBoi = lote.bois.length > 0 ? (lucroTotal / lote.bois.length).toFixed(2) : '0.00';

    return {
      id: lote.id,
      codigo: lote.codigo,
      quantidadeBois: lote.bois.length,
      custoBois: custoTotal.toFixed(2),
      valorVenda: totalVendas.toFixed(2),
      lucroTotal: lucroTotal.toFixed(2),
      margemLucro: `${margemLucro}%`,
      lucroPorBoi: lucroPorBoi
    };
  }).filter((item: any) => {
    const lucro = parseFloat(item.lucroTotal);
    if (minValor !== undefined && lucro < minValor) return false;
    if (maxValor !== undefined && lucro > maxValor) return false;
    return true;
  });

  const dadosOrdenados = aplicarOrdenacao(dadosFormatados, ordenarPor || 'valor_desc', ['lucroTotal', 'margemLucro']);

  return {
    dados: dadosOrdenados,
    resumo: {
      totalRegistros: dadosOrdenados.length,
      lucroTotalGeral: dadosFormatados.reduce((acc: number, item: any) => acc + parseFloat(item.lucroTotal), 0).toFixed(2),
      margemMédia: (
        dadosFormatados.reduce((acc: number, item: any) => acc + parseFloat(item.margemLucro), 0) / Math.max(dadosFormatados.length, 1)
      ).toFixed(2),
      lucroPorBoiMédio: (
        dadosFormatados.reduce((acc: number, item: any) => acc + parseFloat(item.lucroPorBoi), 0) / Math.max(dadosFormatados.length, 1)
      ).toFixed(2)
    }
  };
}

async function gerarAnáliseCompleta(
  prisma: any,
  dataFilter: any,
  minValor?: number,
  maxValor?: number
) {
  const lotes = await prisma.lote.findMany({
    include: {
      bois: {
        include: {
          historico: true
        }
      },
      vendas: true
    }
  });

  const dadosFormatados = lotes.map((lote: any) => {
    const totalBois = lote.bois.length;
    const pesoTotal = lote.bois.reduce((acc: number, boi: any) => acc + boi.peso, 0);
    const pesoMedio = totalBois > 0 ? pesoTotal / totalBois : 0;
    const totalVendas = lote.vendas.reduce((acc: number, v: any) => acc + v.valor, 0);
    const lucroTotal = totalVendas - lote.custo;

    return {
      codigo: lote.codigo,
      dataChegada: new Date(lote.chegada).toLocaleDateString('pt-BR'),
      quantidadeBois: totalBois,
      pesoMedio: pesoMedio.toFixed(2),
      pesoTotal: pesoTotal.toFixed(2),
      custo: lote.custo.toFixed(2),
      valorVenda: totalVendas.toFixed(2),
      lucro: lucroTotal.toFixed(2),
      status: totalVendas > 0 ? 'Vendido' : 'Em criação',
      vacinado: lote.vacinado ? 'Sim' : 'Não'
    };
  });

  return {
    dados: dadosFormatados,
    resumo: {
      totalRegistros: dadosFormatados.length,
      totalBois: dadosFormatados.reduce((acc: number, item: any) => acc + item.quantidadeBois, 0),
      pesoMedioGeral: (
        dadosFormatados.reduce((acc: number, item: any) => acc + parseFloat(item.pesoMedio), 0) / Math.max(dadosFormatados.length, 1)
      ).toFixed(2),
      custosTotal: dadosFormatados.reduce((acc: number, item: any) => acc + parseFloat(item.custo), 0).toFixed(2),
      vendasTotal: dadosFormatados.reduce((acc: number, item: any) => acc + parseFloat(item.valorVenda), 0).toFixed(2),
      lucroTotal: dadosFormatados.reduce((acc: number, item: any) => acc + parseFloat(item.lucro), 0).toFixed(2)
    }
  };
}

function aplicarOrdenacao(dados: any[], ordenarPor: string, camposNumericos: string[]): any[] {
  const copias = [...dados];

  const ordenadores: Record<string, (a: any, b: any) => number> = {
    data_desc: (a, b) => new Date(b.dataChegada || b.dataVenda).getTime() - new Date(a.dataChegada || a.dataVenda).getTime(),
    data_asc: (a, b) => new Date(a.dataChegada || a.dataVenda).getTime() - new Date(b.dataChegada || b.dataVenda).getTime(),
    valor_desc: (a, b) => {
      const campoA = a.valor || a.custo || a.lucroTotal || 0;
      const campoB = b.valor || b.custo || b.lucroTotal || 0;
      return parseFloat(campoB) - parseFloat(campoA);
    },
    valor_asc: (a, b) => {
      const campoA = a.valor || a.custo || a.lucroTotal || 0;
      const campoB = b.valor || b.custo || b.lucroTotal || 0;
      return parseFloat(campoA) - parseFloat(campoB);
    },
    nome_asc: (a, b) => (a.codigo || a.lote || a.nome || '').localeCompare(b.codigo || b.lote || b.nome || '')
  };

  const comparador = ordenadores[ordenarPor] || ordenadores.data_desc;
  return copias.sort(comparador);
}
