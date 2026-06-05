'use client';

import React, { useState, useEffect } from 'react';
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

const LotePage = () => {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingBoiId, setDeletingBoiId] = useState<number | null>(null);
  const [deletingFromLoteId, setDeletingFromLoteId] = useState<number | null>(null);
  const [mostrarVendidos, setMostrarVendidos] = useState(true);

  useEffect(() => {
    fetchLotes();
  }, []);

  const fetchLotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lotes');
      if (!response.ok) {
        throw new Error('Erro ao carregar lotes');
      }
      const data = await response.json();

      // Calcula peso médio e total de cada lote no front
      const lotesComCalculo = data.map((lote: Lote) => {
        const quantidadeBois = Array.isArray(lote.bois) ? lote.bois.length : 0;
        const pesoTotal = Array.isArray(lote.bois)
          ? lote.bois.reduce((acc, boi) => acc + (boi.peso ?? 0), 0)
          : 0;
        const pesoMedio = quantidadeBois > 0 ? pesoTotal / quantidadeBois : 0;

        return {
          ...lote,
          quantidadeBois,
          pesoTotal,
          pesoMedio,
        };
      });

      setLotes(lotesComCalculo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoi = async () => {
    if (!deletingBoiId) return;

    try {
      const response = await fetch(`/api/bois/${deletingBoiId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao remover boi');
      }

      setDeletingBoiId(null);
      setDeletingFromLoteId(null);
      fetchLotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover boi');
    }
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
          <div className="text-lg text-gray-600">Carregando lotes...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Lotes</h1>
          <p className="text-gray-600">Visualize e gerencie os lotes de gado</p>
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
              {mostrarVendidos ? 'Ocultar' : 'Mostrar'} Lotes Vendidos
            </span>
          </label>
          <Link href="/adm/lote/novo-lote">
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
              Adicionar Novo Lote
            </button>
          </Link>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Total de Lotes */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-600">Total de Lotes Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{lotesAtivos.length}</p>
            </div>
          </div>
        </div>

        {/* Total de Bois */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-600">Total de Bois</p>
              <p className="text-2xl font-bold text-gray-900">{String(totalBois)}</p>
            </div>
          </div>
        </div>

        {/* Lotes vacinados */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-600">Lotes Vacinados</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalVacinados}
              </p>
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

      {/* Cards dos lotes */}
      {lotesExibidos.length === 0 && !mostrarVendidos ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">Nenhum lote ativo encontrado</p>
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
                      <h3 className="text-xl font-bold">{lote.codigo}</h3>
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">VENDIDO</span>
                    </div>
                    <p className="text-gray-200 text-sm mt-1">Lote vendido - apenas consulta de datas</p>
                  </div>
                ) : (
                  <Link href={`/adm/lote/${lote.id}`}>
                    <div>
                      <h3 className="text-xl font-bold">{lote.codigo}</h3>
                      <p className="text-green-100 text-sm">Clique para ver estatísticas</p>
                    </div>
                  </Link>
                )}
              </div>

              <div className="p-4 space-y-3">
                {!isVendido && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Quantidade de Bois:</span>
                      <span className="font-bold text-lg text-gray-900">{quantidadeBois}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Peso Médio:</span>
                      <span className="font-bold text-lg text-green-600">
                        {pesoMedio > 0 ? `${pesoMedio.toFixed(1)} kg` : '—'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Vacinação:</span>
                      <span
                        className={`font-bold text-lg ${
                          lote.vacinado ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {lote.vacinado ? 'Vacinado' : 'Não vacinado'}
                      </span>
                    </div>

                    {lote.vacinado && lote.data_vacinacao && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Data da Vacinação:</span>
                        <span className="font-bold text-gray-900">
                          {new Date(lote.data_vacinacao).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">📅 Data de Chegada:</span>
                  <span className="font-bold text-gray-900">
                    {new Date(lote.chegada).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {lote.data_venda && (
                  <div className="flex justify-between items-center bg-yellow-50 p-2 rounded border border-yellow-200">
                    <span className="text-gray-700 font-medium">🚪 Data de Saída:</span>
                    <span className="font-bold text-yellow-700">
                      {new Date(lote.data_venda).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                {!isVendido && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Custo Compra do Lote:</span>
                      <span className="font-bold text-lg text-green-600">
                        R$ {lote.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Gasto Alimentação:</span>
                      <span className="font-bold text-lg text-blue-600">
                        R$ {gastoAlimentacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}

                <div className="pt-2 border-t space-y-2">
                  {!isVendido ? (
                    <div className="flex gap-2">
                      <Link href={`/adm/lote/${lote.id}/adicionar-bois`} className="flex-1">
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
                          Adicionar
                        </button>
                      </Link>
                      <button
                        onClick={() => setDeletingFromLoteId(lote.id)}
                        disabled={quantidadeBois === 0}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded text-center font-medium">
                      ⚠️ Lote vendido - apenas consulta de datas
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
