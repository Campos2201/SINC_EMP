'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TableFilter, FilterColumn } from '@/app/components/TableFilter';

interface Pesagem {
  id: number;
  peso: number;
  dataPesagem: string;
}

interface Boi {
  id: number;
  peso: number;
  status: string;
  alerta: string | null;
  lote: {
    id: number;
    codigo: string;
  };
}

const PesagemPage = () => {
  const router = useRouter();
  const params = useParams();
  const loteId = params.id as string;
  const boiId = params.boiId as string;
  
  const [boi, setBoi] = useState<Boi | null>(null);
  const [historico, setHistorico] = useState<Pesagem[]>([]);
  const [filteredHistorico, setFilteredHistorico] = useState<Pesagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Formulário de nova pesagem
  const [novoPeso, setNovoPeso] = useState('');
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetchDados();
  }, [boiId]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bois/${boiId}/pesagem`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do boi');
      }
      const data = await response.json();
      setBoi(data.boi);
      setHistorico(data.historico);
      setFilteredHistorico(data.historico);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const filterColumns: FilterColumn[] = [
    { key: 'dataPesagem', label: 'Data da Pesagem', type: 'date' },
    { key: 'peso', label: 'Peso (kg)', type: 'number' }
  ];

  const adicionarPesagem = async () => {
    if (!novoPeso || parseFloat(novoPeso) <= 0) {
      alert('Por favor, insira um peso válido.');
      return;
    }

    // Validar data de pesagem (não pode ser futura)
    if (novaData) {
      const dataPesagemObj = new Date(novaData);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      dataPesagemObj.setHours(0, 0, 0, 0);
      
      if (dataPesagemObj > hoje) {
        alert('A data de pesagem não pode ser futura');
        return;
      }
    }

    try {
      setSalvando(true);
      const response = await fetch(`/api/bois/${boiId}/pesagem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          peso: parseFloat(novoPeso),
          dataPesagem: novaData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar pesagem');
      }

      // Recarregar dados
      await fetchDados();
      
      // Limpar formulário
      setNovoPeso('');
      setNovaData(new Date().toISOString().split('T')[0]);
      
      alert('Pesagem registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar pesagem:', error);
      alert('Erro ao adicionar pesagem: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setSalvando(false);
    }
  };

  const calcularEvolucao = () => {
    if (historico.length < 2) return 0;
    const primeira = historico[0].peso;
    const ultima = historico[historico.length - 1].peso;
    return ultima - primeira;
  };

  const calcularGanhoMedio = () => {
    if (historico.length < 2) return 0;
    const primeira = historico[0].peso;
    const ultima = historico[historico.length - 1].peso;
    const dias = Math.ceil((new Date(historico[historico.length - 1].dataPesagem).getTime() - new Date(historico[0].dataPesagem).getTime()) / (1000 * 60 * 60 * 24));
    return dias > 0 ? (ultima - primeira) / dias : 0;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Carregando dados do boi...</div>
        </div>
      </div>
    );
  }

  if (error || !boi) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          {error || 'Boi não encontrado'}
        </h1>
        <button 
          onClick={() => router.push(`/adm/lote/${loteId}`)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Voltar ao Lote
        </button>
      </div>
    );
  }

  const evolucao = calcularEvolucao();
  const ganhoMedio = calcularGanhoMedio();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/adm/lote/${loteId}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Voltar ao Lote</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Evolução de Peso - Boi #{boi.id}
            </h1>
            <p className="text-gray-600">Lote: {boi.lote.codigo}</p>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Peso Atual</p>
            <p className="text-3xl font-bold text-blue-600">{boi.peso} kg</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Total de Pesagens</p>
            <p className="text-3xl font-bold text-gray-900">{historico.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Evolução Total</p>
            <p className={`text-3xl font-bold ${evolucao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {evolucao >= 0 ? '+' : ''}{evolucao.toFixed(1)} kg
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Ganho Médio/Dia</p>
            <p className={`text-3xl font-bold ${ganhoMedio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ganhoMedio >= 0 ? '+' : ''}{ganhoMedio.toFixed(2)} kg
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução */}
      {historico.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gráfico de Evolução de Peso</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={historico.map((p, index) => {
              // Formatar data corretamente para evitar problemas de timezone
              const formatarData = (dataStr: string) => {
                // Se já está no formato YYYY-MM-DD, usar diretamente
                if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  const [y, m, d] = dataStr.split('-').map(Number);
                  return `${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y}`;
                }
                // Caso contrário, tentar parsear como Date
                const d = new Date(dataStr);
                return d.toLocaleDateString('pt-BR');
              };
              return {
                data: formatarData(p.dataPesagem),
                peso: p.peso,
                index: index + 1
              };
            })}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="peso" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Formulário de Nova Pesagem */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Nova Pesagem</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peso (kg) *
            </label>
            <input
              type="number"
              value={novoPeso}
              onChange={(e) => setNovoPeso(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="450.5"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da Pesagem *
            </label>
            <input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={adicionarPesagem}
              disabled={salvando || !novoPeso}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Plus size={20} />
              <span>{salvando ? 'Salvando...' : 'Adicionar Pesagem'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Histórico */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Histórico de Pesagens</h3>
          <TableFilter
            data={historico}
            columns={filterColumns}
            onFilterChange={setFilteredHistorico}
          />
        </div>
        <div className="p-6">
          {filteredHistorico.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">#</th>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Peso (kg)</th>
                    <th className="px-6 py-3">Evolução</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistorico.map((pesagem, index) => {
                    const originalIndex = historico.findIndex(p => p.id === pesagem.id);
                    const prevIndex = originalIndex > 0 ? originalIndex - 1 : -1;
                    const pesagemAnterior = prevIndex >= 0 ? historico[prevIndex] : null;
                    const evolucaoAnterior = pesagemAnterior ? pesagem.peso - pesagemAnterior.peso : 0;
                    return (
                      <tr key={pesagem.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{originalIndex >= 0 ? originalIndex + 1 : index + 1}</td>
                        <td className="px-6 py-4">
                          {(() => {
                            // Formatar data corretamente para evitar problemas de timezone
                            if (pesagem.dataPesagem.match(/^\d{4}-\d{2}-\d{2}$/)) {
                              const [y, m, d] = pesagem.dataPesagem.split('-').map(Number);
                              return `${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y}`;
                            }
                            return new Date(pesagem.dataPesagem).toLocaleDateString('pt-BR');
                          })()}
                        </td>
                        <td className="px-6 py-4 font-semibold">{pesagem.peso} kg</td>
                        <td className="px-6 py-4">
                          {pesagemAnterior && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              evolucaoAnterior >= 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {evolucaoAnterior >= 0 ? '+' : ''}{evolucaoAnterior.toFixed(1)} kg
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma pesagem registrada ainda.</p>
              <p className="text-sm text-gray-400">Adicione a primeira pesagem usando o formulário acima.</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum resultado encontrado com os filtros aplicados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PesagemPage;