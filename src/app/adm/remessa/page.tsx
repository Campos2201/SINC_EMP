'use client'; 

//------------TERMINAR DE ARRUMAR ESSA BUDEGA!!! -------------------------

import React, { useState } from 'react';
import Link from 'next/link';

interface Boi {
  id: number;
  peso: number;
}

interface Lote {
  id: number;
  codigo: string;
  chegada: string;
  custo: number;
  gasto_alimentacao?: number | null;
  data_venda?: string | null;
  vacinado: boolean;
  data_vacinacao: string | null;
  quantidadeBois?: number;
  pesoMedio?: number | null;
  pesoTotal?: number | null;
  bois?: Boi[];
}

const mockLotes: Lote[] = [
  {
    id: 1,
    codigo: 'LOTE 001',
    chegada: new Date().toISOString(),
    custo: 25000,
    gasto_alimentacao: 3400,
    data_venda: null,
    vacinado: true,
    data_vacinacao: new Date().toISOString(),
    quantidadeBois: 5,
    pesoMedio: 240,
    pesoTotal: 1200,
    bois: [
      { id: 1, peso: 240 },
      { id: 2, peso: 240 },
      { id: 3, peso: 240 },
      { id: 4, peso: 240 },
      { id: 5, peso: 240 }
    ]
  },
  {
    id: 2,
    codigo: 'LOTE 002',
    chegada: new Date().toISOString(),
    custo: 18000,
    gasto_alimentacao: 2200,
    data_venda: new Date().toISOString(),
    vacinado: false,
    data_vacinacao: '',
    quantidadeBois: 4,
    pesoMedio: 225,
    pesoTotal: 900,
    bois: [
      { id: 6, peso: 230 },
      { id: 7, peso: 220 },
      { id: 8, peso: 225 },
      { id: 9, peso: 225 }
    ]
  }
];

const LotePage = () => {
  const [lotes, setLotes] = useState<Lote[]>(mockLotes);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [deletingBoiId, setDeletingBoiId] = useState<number | null>(null);
  const [deletingFromLoteId, setDeletingFromLoteId] = useState<number | null>(null);
  const [mostrarVendidos, setMostrarVendidos] = useState(true);

  const handleDeleteBoi = () => {
    if (!deletingBoiId || deletingFromLoteId === null) return;

    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.id !== deletingFromLoteId) return lote;

        const bois = lote.bois?.filter((boi) => boi.id !== deletingBoiId) || [];
        const quantidadeBois = bois.length;
        const pesoTotal = bois.reduce((acc, boi) => acc + (boi.peso || 0), 0);
        const pesoMedio = quantidadeBois > 0 ? pesoTotal / quantidadeBois : 0;

        return {
          ...lote,
          bois,
          quantidadeBois,
          pesoTotal,
          pesoMedio,
        };
      })
    );

    setDeletingBoiId(null);
    setDeletingFromLoteId(null);
  };

  // Filtrar lotes baseado na preferência do usuário
  const lotesExibidos = mostrarVendidos 
    ? lotes 
    : lotes.filter(lote => !lote.data_venda);

  // Totais gerais (topo) - apenas lotes ativos
  const lotesAtivos = lotes.filter(lote => !lote.data_venda);
  const totalBois = lotesAtivos.reduce((acc, lote) => acc + (lote.quantidadeBois || 0), 0);
  const totalVacinados = lotesAtivos.filter((l) => l.vacinado).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Carregando remessas...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Erro: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Remessa</h1>
          <p className="text-gray-600">Visualize e gerencie as remessas</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle para mostrar/ocultar lotes vendidos */}
          <label className="flex items-center gap-2 cursor-pointer bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
            <input
              type="checkbox"
              checked={mostrarVendidos}
              onChange={(e) => setMostrarVendidos(e.target.checked)}
              className="w-4 h-4 rounded text-green-600"
            />
            <span className="text-sm font-medium text-gray-700">
              {mostrarVendidos ? 'Ocultar' : 'Mostrar'} Remessas Fechadas
            </span>
          </label>
          <Link href="/adm/remessa/nova-remessa">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Criar Nova Remessa
            </button>
          </Link>
        </div>
      </div>
      <div className="mb-6">
        {/* Remessa Atual */}
        <div className="bg-white p-6 rounded-lg shadow border max-w-sm">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-600">Remessa Atual</p>
              <p className="text-2xl font-bold text-gray-900">{new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {deletingFromLoteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Remover Boi</h3>
            <p className="text-gray-600 mb-4">Selecione qual boi deseja remover do lote:</p>

            <div className="mb-6 max-h-64 overflow-y-auto">
              {lotes
                .find((l) => l.id === deletingFromLoteId)
                ?.bois?.map((boi) => (
                  <button
                    key={boi.id}
                    onClick={() => setDeletingBoiId(boi.id)}
                    className={`w-full text-left p-3 mb-2 rounded border transition-colors ${
                      deletingBoiId === boi.id
                        ? 'bg-red-100 border-red-600'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-semibold text-gray-900">ID: {boi.id}</span>
                    <span className="text-gray-600 ml-2">Peso: {boi.peso} kg</span>
                  </button>
                ))}
            </div>

            {deletingBoiId && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 text-sm">
                  Tem certeza que deseja remover o boi <span className="font-bold">#{deletingBoiId}</span> do sistema? Esta ação não pode ser desfeita.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeletingFromLoteId(null);
                  setDeletingBoiId(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteBoi}
                disabled={!deletingBoiId}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards das remessas */}
      {lotesExibidos.length === 0 && !mostrarVendidos ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">Nenhuma remessa ativa encontrada</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lotesExibidos.map((lote) => {
          const quantidadeBois = lote.quantidadeBois || 0;
          const pesoMedio = lote.pesoMedio || 0;
          const gastoAlimentacao = lote.gasto_alimentacao || 0;

          const isVendido = !!lote.data_venda;

          return (
            <div key={lote.id} className={`bg-white rounded-lg shadow border overflow-hidden ${isVendido ? 'opacity-75' : ''}`}>
              <div className={`${isVendido ? 'bg-gray-500' : 'bg-green-600'} text-white p-4 ${isVendido ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-green-700'} transition-colors`}>
                {isVendido ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Remessa {new Date().getMonth() + 1}/{new Date().getFullYear()}</h3>
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">FECHADA</span>
                    </div>
                    <p className="text-gray-200 text-sm mt-1">Remessa fechada - apenas consulta</p>
                  </div>
                ) : (
                  <Link href={`/adm/lote/${lote.id}`}>
                    <div>
                      <h3 className="text-xl font-bold">Remessa {new Date().getMonth() + 1}/{new Date().getFullYear()}</h3>
                      <p className="text-green-100 text-sm">Clique para ver detalhes</p>
                    </div>
                  </Link>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mês/Ano:</span>
                  <span className="font-bold text-lg text-gray-900">{new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Gastos Totais:</span>
                  <span className="font-bold text-lg text-red-600">
                    R$ {(lote.custo + (gastoAlimentacao || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ganhos Totais:</span>
                  {isVendido ? (
                    <span className="font-bold text-lg text-green-600">
                      R$ {((lote.pesoTotal || 0) * 15).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="font-bold text-lg text-gray-500">Pendente</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-bold text-lg ${isVendido ? 'text-green-600' : 'text-blue-600'}`}>
                    {isVendido ? 'Finalizada' : 'Em Andamento'}
                  </span>
                </div>

                <div className="pt-2 border-t space-y-2">
                  {!isVendido ? (
                    <div className="flex gap-2">
                      <Link href={`/adm/remessa/${lote.id}`} className="flex-1">
                        <button className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Ver Detalhes
                        </button>
                      </Link>
                      <Link href={`/adm/remessa/${lote.id}/adicionar-movimentacao`} className="flex-1">
                        <button className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Adicionar Movimentação
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded text-center font-medium">
                      ⚠️ Remessa fechada - apenas consulta
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default LotePage;
