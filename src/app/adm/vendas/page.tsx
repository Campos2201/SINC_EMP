'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

// Tipagem dos Dados
interface VendaAPI {
  id: number;
  dataVenda: string;
  valor: number;
  loteId: number;
  lote: {
    id: number;
    codigo: string;
    chegada: string;
    custo: number;
    gasto_alimentacao?: number | null;
    vacinado: boolean;
    quantidadeBois: number;
  };
  lucro: number;
  margemLucro: string;
}

interface LoteDisponivel {
  id: number;
  codigo: string;
  chegada: string;
  custo: number;
  vacinado: boolean;
  gasto_alimentacao?: number | null;
  quantidadeBois: number;
  pesoMedio: number;
  pesoTotal: number;
}

// Função para formatar data sem problemas de timezone
const formatarData = (dataInput: string | Date): string => {
  try {
    let dataStr: string;
    
    // Se for Date, converte para string ISO
    if (dataInput instanceof Date) {
      dataStr = dataInput.toISOString();
    } else {
      dataStr = String(dataInput);
    }
    
    // Se a data vem como string ISO (com T), extrai apenas a parte da data
    if (dataStr.includes('T')) {
      const [dataPart] = dataStr.split('T');
      const [ano, mes, dia] = dataPart.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    
    // Se já vem no formato YYYY-MM-DD, converte
    if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [ano, mes, dia] = dataStr.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    
    // Tenta parsear como Date e formatar
    const data = new Date(dataStr);
    if (!isNaN(data.getTime())) {
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    
    return dataStr;
  } catch {
    return String(dataInput);
  }
};

export default function VendasPage() {
  const [vendas, setVendas] = useState<VendaAPI[]>([]);
  const [lotes, setLotes] = useState<LoteDisponivel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Estados do formulário
  const [dataVenda, setDataVenda] = useState('');
  const [loteVendidoId, setLoteVendidoId] = useState('');
  const [valorVenda, setValorVenda] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [pesoMedioVenda, setPesoMedioVenda] = useState<number | null>(null);
  const [lotesProntos, setLotesProntos] = useState<LoteDisponivel[]>([]);

  // Buscar dados do banco
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        setErro(null);

        // Buscar lotes (filtrar apenas lotes não vendidos)
        const resLotes = await fetch('/api/lotes', { cache: 'no-store' });
        if (!resLotes.ok) throw new Error('Erro ao carregar lotes');
        const lotesData = await resLotes.json();
        
        // Filtrar apenas lotes não vendidos e calcular quantidade de bois
        const lotesDisponiveis = lotesData
          .filter((lote: any) => !lote.data_venda) // Apenas lotes não vendidos
          .map((lote: any) => {
            const quantidadeBois = Array.isArray(lote.bois) ? lote.bois.length : 0;
            const pesoTotal = Array.isArray(lote.bois)
              ? lote.bois.reduce((acc: number, boi: any) => acc + (boi.peso ?? 0), 0)
              : 0;
            const pesoMedio = quantidadeBois > 0 ? pesoTotal / quantidadeBois : 0;
            
            return {
              ...lote,
              quantidadeBois,
              pesoTotal,
              pesoMedio,
            };
          });
        setLotes(lotesDisponiveis);

        // Buscar vendas
        const resVendas = await fetch('/api/vendas', { cache: 'no-store' });
        if (!resVendas.ok) throw new Error('Erro ao carregar vendas');
        const vendasData = await resVendas.json();
        setVendas(vendasData);

        // Buscar configuração de peso médio de venda e verificar lotes prontos
        const resConfig = await fetch('/api/configuracoes?chave=peso_medio_venda', { cache: 'no-store' });
        if (resConfig.ok) {
          const configData = await resConfig.json();
          if (configData.valor) {
            const pesoConfig = parseFloat(configData.valor);
            if (!isNaN(pesoConfig)) {
              setPesoMedioVenda(pesoConfig);
              
              // Verificar quais lotes estão prontos para venda
              // Usar lotesDisponiveis que já foi calculado acima
              const lotesAptos = lotesDisponiveis.filter((lote: LoteDisponivel) => 
                lote.pesoMedio >= pesoConfig && lote.quantidadeBois > 0
              );
              setLotesProntos(lotesAptos);
            }
          }
        }
      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar dados');
        console.error(err);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  const handleRegistrarVenda = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loteVendidoId || !valorVenda) {
      setMensagem({ tipo: 'erro', texto: 'Preencha todos os campos obrigatórios' });
      return;
    }

    if (parseFloat(valorVenda) <= 0) {
      setMensagem({ tipo: 'erro', texto: 'Valor deve ser maior que zero' });
      return;
    }

    // Validar data de venda (não pode ser futura)
    if (dataVenda) {
      const dataVendaObj = new Date(dataVenda);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      dataVendaObj.setHours(0, 0, 0, 0);
      
      if (dataVendaObj > hoje) {
        setMensagem({ tipo: 'erro', texto: 'Não é possível registrar venda com data futura' });
        return;
      }
    }

    try {
      setRegistrando(true);
      setMensagem(null);

      const response = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loteId: parseInt(loteVendidoId),
          dataVenda: dataVenda || new Date().toISOString().split('T')[0],
          valor: parseFloat(valorVenda)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao registrar venda');
      }

      const resultado = await response.json();
      
      // Atualizar lista de vendas
      setVendas([resultado.venda, ...vendas]);
      
      // Atualizar lista de lotes (remover o vendido)
      setLotes(lotes.filter(l => l.id !== parseInt(loteVendidoId)));

      // Limpar formulário
      setDataVenda('');
      setLoteVendidoId('');
      setValorVenda('');

      setMensagem({ 
        tipo: 'sucesso', 
        texto: '✅ Venda registrada com sucesso!' 
      });

      // Limpar mensagem após 3 segundos
      setTimeout(() => setMensagem(null), 3000);
    } catch (err: any) {
      setMensagem({ 
        tipo: 'erro', 
        texto: err.message || 'Erro ao registrar venda' 
      });
    } finally {
      setRegistrando(false);
    }
  };

  const totalVendas = vendas.reduce((acc, venda) => acc + venda.valor, 0);
  const totalLucro = vendas.reduce((acc, venda) => acc + venda.lucro, 0);
  const vendaMedia = vendas.length > 0 ? totalVendas / vendas.length : 0;
  const lotesVendidos = vendas.length;
  const lotesDisponiveis = lotes.length;

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">💰 Vendas Realizadas</h2>
      
      {/* Aviso de Lotes Prontos para Venda */}
      {lotesProntos.length > 0 && pesoMedioVenda && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-800 mb-2">
                🎉 Lotes Prontos para Venda!
              </h3>
              <p className="text-green-700 mb-3">
                {lotesProntos.length === 1 
                  ? '1 lote atingiu o peso médio mínimo para venda'
                  : `${lotesProntos.length} lotes atingiram o peso médio mínimo para venda`
                } (peso médio configurado: {pesoMedioVenda.toFixed(2)} kg)
              </p>
              <div className="space-y-2">
                {lotesProntos.map((lote) => (
                  <div key={lote.id} className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{lote.codigo}</p>
                        <p className="text-sm text-gray-600">
                          Peso médio: <span className="font-semibold text-green-600">{lote.pesoMedio.toFixed(2)} kg</span>
                          {' • '}
                          {lote.quantidadeBois} bois
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                          PRONTO
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagens de Status */}
      {mensagem && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          mensagem.tipo === 'sucesso' 
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {mensagem.tipo === 'sucesso' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p className="font-medium">{mensagem.texto}</p>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Lotes Vendidos</h3>
          <p className="text-2xl font-bold text-green-600">{lotesVendidos}</p>
          <p className="text-sm text-gray-500 mt-1">Lotes comercializados</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Valor Total</h3>
          <p className="text-2xl font-bold text-blue-600">
            R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Receita de vendas</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Lucro Total</h3>
          <p className="text-2xl font-bold text-yellow-600">
            R$ {totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Lucro bruto</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Lotes Disponíveis</h3>
          <p className="text-2xl font-bold text-purple-600">{lotesDisponiveis}</p>
          <p className="text-sm text-gray-500 mt-1">Prontos para vender</p>
        </div>
      </div>

      {/* Formulário de Nova Venda */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">📝 Registrar Nova Venda</h3>
        
        {lotesDisponiveis === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
            <p className="font-medium">⚠️ Nenhum lote disponível para vender</p>
            <p className="text-sm mt-1">Todos os lotes já foram comercializados ou cadastre novos lotes.</p>
          </div>
        ) : (
          <form onSubmit={handleRegistrarVenda} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Seleção de Lote */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📦 Lote a Vender <span className="text-red-500">*</span>
                </label>
                <select 
                  value={loteVendidoId}
                  onChange={(e) => setLoteVendidoId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione o lote</option>
                  {lotes.map(lote => (
                              <option key={lote.id} value={lote.id}>
                                {lote.codigo} (Custo: R$ {(Number(lote.custo || 0) + Number(lote.gasto_alimentacao || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                              </option>
                  ))}
                </select>
              </div>

              {/* Data da Venda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Data da Venda
                </label>
                <input 
                  type="date" 
                  value={dataVenda}
                  onChange={(e) => setDataVenda(e.target.value)}
                  max={new Date().toISOString().split('T')[0]} // Impede selecionar data futura
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Se vazio, usa data atual</p>
              </div>

              {/* Valor da Venda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Valor de Venda (R$) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={valorVenda}
                  onChange={(e) => setValorVenda(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            {/* Informações do Lote Selecionado */}
            {loteVendidoId && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {lotes.find(l => l.id === parseInt(loteVendidoId)) && (() => {
                  const loteSelecionado = lotes.find(l => l.id === parseInt(loteVendidoId))!;
                  const custoTotal = Number(loteSelecionado.custo || 0) + Number(loteSelecionado.gasto_alimentacao || 0);
                  const lucroEstimado = parseFloat(valorVenda || '0') - custoTotal;
                  const margemEstimada = custoTotal > 0 
                    ? (lucroEstimado / custoTotal * 100).toFixed(2)
                    : '0';
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Custo do Lote</p>
                        <p className="font-semibold text-gray-800">
                          R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Quantidade de Bois</p>
                        <p className="font-semibold text-gray-800">{loteSelecionado.quantidadeBois}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Lucro Estimado</p>
                        <p className={`font-semibold ${lucroEstimado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {lucroEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Margem Estimada</p>
                        <p className={`font-semibold ${parseFloat(margemEstimada) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {margemEstimada}%
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Botão */}
            <div className="flex gap-3">
              <button 
                type="submit"
                disabled={registrando || lotesDisponiveis === 0}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {registrando ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  '✅ Registrar Venda'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tabela de Vendas */}
      {vendas.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">📊 Histórico de Vendas</h3>
            <p className="text-sm text-gray-600 mt-1">Total de {vendas.length} venda{vendas.length !== 1 ? 's' : ''} registrada{vendas.length !== 1 ? 's' : ''}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Data</th>
                  <th className="px-6 py-3 text-left font-semibold">Lote</th>
                  <th className="px-6 py-3 text-right font-semibold">Custo</th>
                  <th className="px-6 py-3 text-right font-semibold">Valor Venda</th>
                  <th className="px-6 py-3 text-right font-semibold">Lucro</th>
                  <th className="px-6 py-3 text-right font-semibold">Margem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vendas.map((venda, idx) => (
                  <tr key={venda.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm">
                      {formatarData(venda.dataVenda)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {venda.lote.codigo}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      R$ {(Number(venda.lote.custo || 0) + Number(venda.lote.gasto_alimentacao || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-blue-600">
                      R$ {venda.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">
                      R$ {venda.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">
                      {venda.margemLucro}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">Nenhuma venda registrada ainda</p>
          <p className="text-gray-500 text-sm mt-2">Comece registrando sua primeira venda no formulário acima</p>
        </div>
      )}
    </div>
  );
}