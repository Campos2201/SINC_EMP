'use client';

import React, { useState } from 'react';
import RelatorioTable from './components/RelatorioTable';

export type RelatorioTipo = 'remessas';

export interface FiltrosRelatorio {
  tipo: RelatorioTipo;
  dataInicio?: string;
  dataFim?: string;
  ordenarPor?: string;
}

export default function RelatoriosPage() {
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    tipo: 'remessas',
    ordenarPor: 'data_desc'
  });
  
  const [relatorioGerado, setRelatorioGerado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const gerarRelatorio = async () => {
    setCarregando(true);
    setErro(null);
    
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('tipo', filtros.tipo);
      if (filtros.dataInicio) queryParams.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) queryParams.append('dataFim', filtros.dataFim);
      if (filtros.ordenarPor) queryParams.append('ordenarPor', filtros.ordenarPor);

      const response = await fetch(`/api/relatorios?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao gerar relatório: ${response.status}`);
      }

      const resultado = await response.json();
      setDados(resultado);
      setRelatorioGerado(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
      setRelatorioGerado(false);
    } finally {
      setCarregando(false);
    }
  };

  const getTituloRelatorio = (): string => {
    const titulos: Record<RelatorioTipo, string> = {
      remessas: 'Extrato detalhado de entradas e saídas'
    };
    return titulos[filtros.tipo];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-800">Gerador de Relatórios</h1>
        <p className="text-gray-600 mt-2">Exiba o extrato detalhado de entradas e saídas de todas as remessas no intervalo de datas selecionado</p>
      </div>

      {/* Seção de Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Filtros e Configurações</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Tipo de Relatório */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Relatório
            </label>
            <select
              name="tipo"
              value={filtros.tipo}
              onChange={handleFiltroChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
            >
              <option value="remessas">📦 Remessas</option>
            </select>
          </div>

          {/* Data Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Início
            </label>
            <input
              type="date"
              name="dataInicio"
              value={filtros.dataInicio || ''}
              onChange={handleFiltroChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fim
            </label>
            <input
              type="date"
              name="dataFim"
              value={filtros.dataFim || ''}
              onChange={handleFiltroChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>

          {/* Ordenar Por */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar Por
            </label>
            <select
              name="ordenarPor"
              value={filtros.ordenarPor}
              onChange={handleFiltroChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
            >
              <option value="data_desc">Data (Recente)</option>
              <option value="data_asc">Data (Antiga)</option>
              <option value="valor_desc">Valor (Maior)</option>
              <option value="valor_asc">Valor (Menor)</option>
              <option value="nome_asc">Nome (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Botão Gerar Relatório */}
        <div className="flex gap-4">
          <button
            onClick={gerarRelatorio}
            disabled={carregando}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
              carregando
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:scale-95'
            }`}
          >
            {carregando ? '⏳ Gerando...' : '🔄 Gerar Relatório'}
          </button>
          
          <button
            onClick={() => {
              setRelatorioGerado(false);
              setDados(null);
              setErro(null);
            }}
            className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
          >
            🔄 Limpar
          </button>
        </div>
      </div>

      {/* Mensagens de Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">❌ Erro</p>
          <p>{erro}</p>
        </div>
      )}

      {/* Relatório Gerado */}
      {relatorioGerado && dados && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">{getTituloRelatorio()}</h2>
            <div className="text-sm text-gray-600">
              {dados.resumo && (
                <p>📊 {dados.resumo.totalMovimentacoes ?? dados.dados.length} movimentações encontradas</p>
              )}
            </div>
          </div>

          <RelatorioTable
            tipo={filtros.tipo}
            dados={dados.dados}
            resumo={dados.resumo}
          />
        </div>
      )}

      {/* Estado Inicial */}
      {!relatorioGerado && !carregando && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <p className="text-blue-700 text-lg">
            👈 Configure os filtros acima e clique em "Gerar Relatório" para começar
          </p>
        </div>
      )}
    </div>
  );
}
