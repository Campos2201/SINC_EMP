'use client';

import React, { useState } from 'react';
import GraficoVendas from './components/GraficoVendas';
import TabelaVendas from './components/TabelaVendas';

export type TipoGrafico = 'linha' | 'barra' | 'pizza' | 'area';
export type MetricaVendas = 'valor' | 'quantidade' | 'lucro' | 'margem';
export type AgrupadoPor = 'data' | 'lote' | 'mes' | 'semana';

export interface FiltrosAnalise {
  dataInicio?: string;
  dataFim?: string;
  tipoGrafico: TipoGrafico;
  metricas: MetricaVendas[];
  agrupadoPor: AgrupadoPor;
  mostrarTabela: boolean;
}

export default function AnaliseVendasPage() {
  const [filtros, setFiltros] = useState<FiltrosAnalise>({
    tipoGrafico: 'linha',
    metricas: ['valor'],
    agrupadoPor: 'data',
    mostrarTabela: true
  });

  const [analiseGerada, setAnaliseGerada] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      const metrica = name as MetricaVendas;
      
      setFiltros(prev => ({
        ...prev,
        metricas: checked
          ? [...prev.metricas, metrica]
          : prev.metricas.filter(m => m !== metrica)
      }));
    } else {
      setFiltros(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxTabela = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros(prev => ({
      ...prev,
      mostrarTabela: e.target.checked
    }));
  };

  const gerarAnalise = async () => {
    if (filtros.metricas.length === 0) {
      setErro('Selecione pelo menos uma métrica para analisar');
      return;
    }

    // Validar datas (não podem ser futuras e data fim deve ser >= data início)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (filtros.dataInicio) {
      const dataInicioObj = new Date(filtros.dataInicio);
      dataInicioObj.setHours(0, 0, 0, 0);
      if (dataInicioObj > hoje) {
        setErro('A data de início não pode ser futura');
        return;
      }
    }

    if (filtros.dataFim) {
      const dataFimObj = new Date(filtros.dataFim);
      dataFimObj.setHours(0, 0, 0, 0);
      if (dataFimObj > hoje) {
        setErro('A data de fim não pode ser futura');
        return;
      }
    }

    if (filtros.dataInicio && filtros.dataFim) {
      const dataInicioObj = new Date(filtros.dataInicio);
      const dataFimObj = new Date(filtros.dataFim);
      dataInicioObj.setHours(0, 0, 0, 0);
      dataFimObj.setHours(0, 0, 0, 0);
      if (dataInicioObj > dataFimObj) {
        setErro('A data de início deve ser anterior ou igual à data de fim');
        return;
      }
    }

    setCarregando(true);
    setErro(null);

    try {
      const queryParams = new URLSearchParams();
      if (filtros.dataInicio) queryParams.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) queryParams.append('dataFim', filtros.dataFim);
      queryParams.append('tipoGrafico', filtros.tipoGrafico);
      queryParams.append('metricas', filtros.metricas.join(','));
      queryParams.append('agrupadoPor', filtros.agrupadoPor);

      const response = await fetch(`/api/vendas/analise?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Erro ao gerar análise: ${response.status}`);
      }

      const resultado = await response.json();
      setDados(resultado);
      setAnaliseGerada(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
      setAnaliseGerada(false);
    } finally {
      setCarregando(false);
    }
  };

  const obterTituloMetrica = (metrica: MetricaVendas): string => {
    const titulos: Record<MetricaVendas, string> = {
      valor: 'Valor de Venda',
      quantidade: 'Quantidade de Vendas',
      lucro: 'Lucro',
      margem: 'Margem de Lucro (%)'
    };
    return titulos[metrica];
  };

  // Função para formatar data sem problemas de timezone
  const formatarData = (dataString: string): string => {
    try {
      if (dataString.includes('T')) {
        const [dataPart] = dataString.split('T');
        const [ano, mes, dia] = dataPart.split('-');
        return `${dia}/${mes}/${ano}`;
      }
      if (dataString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = dataString.split('-');
        return `${dia}/${mes}/${ano}`;
      }
      const data = new Date(dataString);
      if (!isNaN(data.getTime())) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      return dataString;
    } catch {
      return dataString;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-800">📊 Análise de Vendas</h1>
        <p className="text-gray-600 mt-2">Visualize tendências e métricas com gráficos e tabelas personalizadas</p>
      </div>

      {/* Seção de Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">⚙️ Configuração da Análise</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Data Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Data Início
            </label>
            <input
              type="date"
              name="dataInicio"
              value={filtros.dataInicio || ''}
              onChange={handleFiltroChange}
              max={filtros.dataFim || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Opcional - filtra desde esta data</p>
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Data Fim
            </label>
            <input
              type="date"
              name="dataFim"
              value={filtros.dataFim || ''}
              onChange={handleFiltroChange}
              min={filtros.dataInicio || undefined}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Opcional - filtra até esta data</p>
          </div>

          {/* Tipo de Gráfico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📈 Tipo de Gráfico
            </label>
            <select
              name="tipoGrafico"
              value={filtros.tipoGrafico}
              onChange={handleFiltroChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="linha">📊 Linha</option>
              <option value="barra">📊 Barra</option>
              <option value="area">📊 Área</option>
              <option value="pizza">🥧 Pizza</option>
            </select>
          </div>

          {/* Agrupado Por */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🗂️ Agrupar Por
            </label>
            <select
              name="agrupadoPor"
              value={filtros.agrupadoPor}
              onChange={handleFiltroChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="data">Por Data</option>
              <option value="lote">Por Lote</option>
              <option value="mes">Por Mês</option>
              <option value="semana">Por Semana</option>
            </select>
          </div>
        </div>

        {/* Seleção de Métricas */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-900 mb-3">📊 Selecione as Métricas para Análise:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['valor', 'quantidade', 'lucro', 'margem'] as MetricaVendas[]).map(metrica => (
              <label key={metrica} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-blue-100 transition-colors">
                <input
                  type="checkbox"
                  name={metrica}
                  checked={filtros.metricas.includes(metrica)}
                  onChange={handleFiltroChange}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {obterTituloMetrica(metrica)}
                </span>
              </label>
            ))}
          </div>
          {filtros.metricas.length === 0 && (
            <p className="text-xs text-red-600 mt-2">⚠️ Selecione pelo menos uma métrica</p>
          )}
        </div>

        {/* Opção de Tabela */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filtros.mostrarTabela}
              onChange={handleCheckboxTabela}
              className="w-4 h-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              📋 Mostrar tabela com dados detalhados
            </span>
          </label>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <button
            onClick={gerarAnalise}
            disabled={carregando}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
              carregando
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {carregando ? '⏳ Gerando...' : '🔄 Gerar Análise'}
          </button>

          <button
            onClick={() => {
              setAnaliseGerada(false);
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

      {/* Análise Gerada */}
      {analiseGerada && dados && (
        <div className="space-y-6">
          {/* Informações do Filtro Aplicado */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">🔍 Filtros Aplicados:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-blue-800">
              {filtros.dataInicio && (
                <div>
                  <strong className="text-blue-900">Data Início:</strong> {formatarData(filtros.dataInicio)}
                </div>
              )}
              {filtros.dataFim && (
                <div>
                  <strong className="text-blue-900">Data Fim:</strong> {formatarData(filtros.dataFim)}
                </div>
              )}
              <div>
                <strong className="text-blue-900">Agrupado por:</strong> {
                  filtros.agrupadoPor === 'data' ? 'Data' :
                  filtros.agrupadoPor === 'lote' ? 'Lote' :
                  filtros.agrupadoPor === 'mes' ? 'Mês' : 'Semana'
                }
              </div>
              <div>
                <strong className="text-blue-900">Total de registros:</strong> {dados.tabela?.length || 0}
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800">📊 Visualização dos Dados</h2>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Tipo:</span> {
                  filtros.tipoGrafico === 'linha' ? 'Linha' :
                  filtros.tipoGrafico === 'barra' ? 'Barra' :
                  filtros.tipoGrafico === 'area' ? 'Área' : 'Pizza'
                }
              </div>
            </div>
            <GraficoVendas
              dados={dados.grafico}
              tipo={filtros.tipoGrafico}
              metricas={filtros.metricas}
            />
          </div>

          {/* Tabela (se selecionado) */}
          {filtros.mostrarTabela && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">📋 Dados Detalhados</h2>
              <TabelaVendas
                dados={dados.tabela}
                metricas={filtros.metricas}
              />
            </div>
          )}

          {/* Resumo Estatístico */}
          {dados.resumo && Object.keys(dados.resumo).length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📈 Resumo Estatístico</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(dados.resumo).map(([chave, valor]: [string, any]) => {
                  const formatarValor = () => {
                    if (typeof valor === 'number') {
                      if (chave.toLowerCase().includes('valor') || chave.toLowerCase().includes('total')) {
                        return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      }
                      if (chave.toLowerCase().includes('margem')) {
                        return `${valor.toFixed(2)}%`;
                      }
                      if (chave.toLowerCase().includes('medio') || chave.toLowerCase().includes('media')) {
                        if (chave.toLowerCase().includes('valor')) {
                          return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                        return valor.toFixed(2);
                      }
                      return valor.toLocaleString('pt-BR');
                    }
                    return valor;
                  };

                  const obterLabel = () => {
                    const labels: Record<string, string> = {
                      totalVendas: 'Total de Vendas',
                      valorTotal: 'Valor Total',
                      valorMedio: 'Valor Médio',
                      quantidadeVendas: 'Quantidade',
                      lucroTotal: 'Lucro Total',
                      lucroMedio: 'Lucro Médio',
                      margemMedia: 'Margem Média'
                    };
                    return labels[chave] || chave.replace(/([A-Z])/g, ' $1').trim();
                  };

                  return (
                    <div key={chave} className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                      <p className="text-sm text-gray-600 font-medium">
                        {obterLabel()}
                      </p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {formatarValor()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado Inicial */}
      {!analiseGerada && !carregando && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <p className="text-blue-700 text-lg font-medium mb-2">
            👈 Configure os filtros acima e clique em "Gerar Análise" para começar
          </p>
          <p className="text-blue-600 text-sm">
            💡 Dica: Os filtros de data são opcionais. Se não preencher, mostrará todas as vendas.
          </p>
        </div>
      )}

      {/* Mensagem quando não há dados */}
      {analiseGerada && dados && dados.tabela && dados.tabela.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold text-lg mb-2">
            ⚠️ Nenhuma venda encontrada
          </p>
          <p className="text-yellow-700 text-sm">
            Não há vendas no período selecionado. Tente ajustar os filtros de data ou verifique se há vendas registradas.
          </p>
        </div>
      )}
    </div>
  );
}
