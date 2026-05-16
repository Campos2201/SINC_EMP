'use client'; 

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Movimentacao {
  id: number;
  descricao: string;
  tipo: 'ENTRADA' | 'SAIDA';
  valor: number;
  createdAt: string;
}

interface Remessa {
  id: number;
  mes: number;
  ano: number;
  status: 'ABERTO' | 'FECHADO';
  createdAt: string;
  updatedAt: string;
  unicoAberto?: boolean | null;
  movimentacoes: Movimentacao[];
  _count: {
    movimentacoes: number;
  };
}

const RemessaPage = () => {
  const [remessas, setRemessas] = useState<Remessa[]>([]);
  const [remessaAberta, setRemessaAberta] = useState<Remessa | null>(null);
  const [closingRemessaId, setClosingRemessaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarVendidos, setMostrarVendidos] = useState(false);

  useEffect(() => {
    const fetchRemessas = async () => {
      try {
        const [allResponse, abertaResponse] = await Promise.all([
          fetch('/api/remessa'),
          fetch('/api/remessa?aberta=true'),
        ]);

        if (!allResponse.ok) {
          throw new Error('Erro ao buscar remessas');
        }
        if (!abertaResponse.ok) {
          throw new Error('Erro ao buscar remessa aberta');
        }

        const allData = await allResponse.json();
        const abertaData = await abertaResponse.json();

        setRemessas(allData);
        setRemessaAberta(Array.isArray(abertaData) ? abertaData[0] ?? null : abertaData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRemessas();
  }, []);

  const fecharRemessa = async (id: number) => {
    const confirmar = window.confirm(
      'Deseja realmente fechar esta remessa? Após o fechamento, não será mais possível adicionar movimentações.'
    );
    if (!confirmar) return;

    try {
      setClosingRemessaId(id);
      const response = await fetch(`/api/remessa/${id}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Erro ao fechar remessa');
      }

      const updatedRemessa = await response.json();
      setRemessas((prevRemessas) =>
        prevRemessas.map((remessa) =>
          remessa.id === id ? { ...remessa, status: updatedRemessa.status, unicoAberto: updatedRemessa.unicoAberto } : remessa
        )
      );

      if (remessaAberta?.id === id) {
        setRemessaAberta(null);
      }

      alert('Remessa fechada com sucesso.');
    } catch (err: any) {
      console.error('Erro ao fechar remessa:', err);
      alert('Erro ao fechar remessa: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setClosingRemessaId(null);
    }
  };

  // No banco, a remessa aberta é identificada por unicoAberto = true;
  // remessas fechadas têm unicoAberto = null.
  const remessasExibidas = mostrarVendidos
    ? remessas
    : remessas.filter(remessa => remessa.status === 'ABERTO');

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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remessa Atual</p>
              {remessaAberta ? (
                <p className="text-2xl font-bold text-gray-900">
                  {remessaAberta.mes}/{remessaAberta.ano}
                </p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">Nenhuma remessa aberta</p>
              )}
            </div>
            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Cards das remessas */}
      {remessasExibidas.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">
            {mostrarVendidos ? 'Nenhuma remessa encontrada' : 'Nenhuma remessa ativa encontrada'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {remessasExibidas.map((remessa) => {
            // Calcular gastos totais (movimentações de SAIDA)
            const gastosTotais = remessa.movimentacoes
              .filter(mov => mov.tipo === 'SAIDA')
              .reduce((acc, mov) => acc + mov.valor, 0);

            // Calcular ganhos totais (movimentações de ENTRADA)
            const ganhosTotais = remessa.movimentacoes
              .filter(mov => mov.tipo === 'ENTRADA')
              .reduce((acc, mov) => acc + mov.valor, 0);

            const isFechada = remessa.status === 'FECHADO';

            return (
              <div key={remessa.id} className={`bg-white rounded-lg shadow border overflow-hidden min-h-[340px] ${isFechada ? 'opacity-75' : ''}`}>
                <div className={`${isFechada ? 'bg-gray-500' : 'bg-green-600'} text-white p-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Remessa {remessa.mes}/{remessa.ano}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${isFechada ? 'bg-red-600' : 'bg-blue-600'}`}>
                      {remessa.status}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Mês/Ano:</span>
                    <span className="font-bold text-lg text-gray-900">{remessa.mes}/{remessa.ano}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Gastos Totais:</span>
                    <span className="font-bold text-lg text-red-600">
                      R$ {gastosTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ganhos Totais:</span>
                    <span className="font-bold text-lg text-green-600">
                      R$ {ganhosTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Saldo da Remessa:</span>
                    <span className={`font-bold text-lg ${ganhosTotais - gastosTotais >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {(ganhosTotais - gastosTotais).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Movimentações:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {remessa._count.movimentacoes}
                    </span>
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    {!isFechada ? (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        <Link href={`/adm/remessa/${remessa.id}`} className="flex-1">
                          <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center">
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
                        <Link href={`/adm/remessa/${remessa.id}/adicionar-movimentacao`} className="flex-1">
                          <button className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Adicionar Movimentação
                          </button>
                        </Link>
                        <button
                          type="button"
                          onClick={() => fecharRemessa(remessa.id)}
                          disabled={closingRemessaId === remessa.id}
                          className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
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
                              d="M17 16l4-4m0 0l-4-4m4 4H7"
                            />
                          </svg>
                          {closingRemessaId === remessa.id ? 'Fechando...' : 'Fechar Remessa'}
                        </button>
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

export default RemessaPage;
