import React from 'react';

// Tipagem dos Dados
export interface LoteComEstatisticas {
    id: number;
    codigo: string;
    chegada: string;
    custo: number;
    gasto_alimentacao?: number | null;
    data_venda: string | null;
    vacinado: boolean;
    data_vacinacao: string | null;
    quantidadeBois: number;
    pesoMedio: number;
    pesoTotal: number;
}

export interface Venda {
    id: number;
    loteId: number;
    loteName?: string;
    dataVenda: string;
    valor: number;
    loteCusto?: number;
    loteGastoAlimentacao?: number;
}

async function fetchLotes(): Promise<LoteComEstatisticas[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/lotes`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Erro ao buscar lotes:', response.status);
      return [];
    }

    // Normaliza os dados vindos da API para incluir quantidadeBois, pesoMedio e pesoTotal
    const data = await response.json();
    const lotes = Array.isArray(data) ? data.map((lote: any) => {
      const quantidadeBois = Array.isArray(lote.bois) ? lote.bois.length : 0;
      const pesoTotal = Array.isArray(lote.bois)
        ? lote.bois.reduce((acc: number, boi: any) => acc + (Number(boi.peso) || 0), 0)
        : 0;
      const pesoMedio = quantidadeBois > 0 ? pesoTotal / quantidadeBois : 0;
      return {
        ...lote,
        quantidadeBois,
        pesoTotal,
        pesoMedio
      } as LoteComEstatisticas;
    }) : [];

    return lotes;
  } catch (error) {
    console.error('Erro ao buscar lotes:', error);
    return [];
  }
}

async function fetchVendas(): Promise<Venda[]> {
  try {
    // Importa o Prisma Client dinamicamente para buscar vendas
    const mod = await import("../../generated/prisma");
    const { PrismaClient } = mod as { PrismaClient: any };

    const g = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };
    g.prisma = g.prisma || new PrismaClient();
    const prisma = g.prisma;

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
      orderBy: {
        dataVenda: 'desc'
      }
      // Removido take: 10 para calcular lucro de todas as vendas
    });

    return vendas.map((venda: any) => ({
      id: venda.id,
      loteId: venda.loteId,
      loteName: venda.Lote.codigo,
      dataVenda: venda.dataVenda.toISOString(),
      // garante que valor seja um number (Prisma pode retornar Decimal)
      valor: Number(venda.valor),
      // Incluir custo e gasto_alimentacao do lote para cálculo de lucro
      loteCusto: Number(venda.Lote.custo || 0),
      loteGastoAlimentacao: Number(venda.Lote.gasto_alimentacao || 0)
    }));
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    return [];
  }
}

export default async function AdminHomePage() {
  // Busca dados reais do banco
  const lotes = await fetchLotes();
  const vendas = await fetchVendas();

  // Filtrar apenas lotes ativos (não vendidos)
  const lotesAtivos = lotes.filter(lote => !lote.data_venda);

  // Estatísticas de lotes ativos
  const totalBois = lotesAtivos.reduce((acc, lote) => {
    const quantidade = typeof lote.quantidadeBois === 'number' ? lote.quantidadeBois : 0;
    return acc + quantidade;
  }, 0);
  
  const totalVendasValor = vendas.reduce((acc, v) => {
    // torna o cálculo tolerante a strings/Decimal: converte para number e trata NaN
    const valorNum = Number((v as any).valor);
    const valor = Number.isFinite(valorNum) ? valorNum : 0;
    return acc + valor;
  }, 0);
  
  // Calcular lucro: soma o lucro de cada venda individual
  // Lucro = Valor da Venda - (Custo do Lote + Gasto de Alimentação)
  const lucro = vendas.reduce((acc, v) => {
    const valorNum = Number(v.valor) || 0;
    const loteCusto = Number(v.loteCusto) || 0;
    const loteGasto = Number(v.loteGastoAlimentacao) || 0;
    const custoTotal = loteCusto + loteGasto;
    const lucroVenda = valorNum - custoTotal;
    
    // Debug: verificar se os valores estão corretos
    // console.log(`Venda ${v.id}: valor=${valorNum}, custo=${loteCusto}, gasto=${loteGasto}, custoTotal=${custoTotal}, lucro=${lucroVenda}`);
    
    return acc + (Number.isFinite(lucroVenda) ? lucroVenda : 0);
  }, 0);
  
  // Lotes vacinados apenas entre os ativos
  const totalLotesVacinados = lotesAtivos.filter(lote => lote.vacinado).length;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Dashboard - Controle de Gado</h2>
      
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total de Lotes</h3>
          <p className="text-3xl font-bold text-green-600">{lotesAtivos.length}</p>
          <p className="text-sm text-gray-500 mt-1">Lotes ativos</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total de Bois</h3>
          <p className="text-3xl font-bold text-blue-600">{String(totalBois)}</p>
          <p className="text-sm text-gray-500 mt-1">Cabeças de gado</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Vendas</h3>
          <p className="text-3xl font-bold text-yellow-600">
            R$ {totalVendasValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">{String(vendas.length)} vendas realizadas</p>
          <p className="text-sm font-semibold text-gray-700 mt-2">
            Lucro líquido: <span className="text-green-600">R$ {lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Lotes Vacinados</h3>
          <p className="text-3xl font-bold text-purple-600">{totalLotesVacinados}</p>
          <p className="text-sm text-gray-500 mt-1">
            {((totalLotesVacinados / Math.max(lotesAtivos.length, 1)) * 100).toFixed(1)}% do total
          </p>
        </div>
      </div>

      {/* Seção de Lotes Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Lotes Recentes</h3>
          <div className="space-y-3">
            {lotesAtivos.length > 0 ? (
              lotesAtivos.map((lote) => {
                const custoTotal = (lote.custo || 0) + (lote.gasto_alimentacao || 0);
                return (
                  <div key={lote.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{lote.codigo}</p>
                      <p className="text-sm text-gray-600">
                        {lote.quantidadeBois} bois • Chegada: {new Date(lote.chegada).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-500">Custo Total</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum lote ativo</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Vendas Recentes</h3>
          <div className="space-y-3">
            {vendas.slice(0, 10).map((venda) => (
              <div key={venda.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{venda.loteName || `Lote #${venda.loteId}`}</p>
                  <p className="text-sm text-gray-600">
                    Data: {new Date(venda.dataVenda).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">
                    R$ {venda.valor.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-500">Valor</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}