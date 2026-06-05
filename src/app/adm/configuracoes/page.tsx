'use client';

import React, { useEffect, useState } from 'react';
import { Save, Settings, AlertCircle, CheckCircle } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [pesoMedioVenda, setPesoMedioVenda] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  const carregarConfiguracao = async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/configuracoes?chave=peso_medio_venda');
      
      // Se a resposta não for ok, pode ser que a configuração ainda não exista
      // Isso é normal na primeira vez, então não lançamos erro
      if (response.ok) {
        const data = await response.json();
        if (data && data.valor) {
          setPesoMedioVenda(data.valor);
        }
      } else {
        // Se não encontrou, deixa vazio (primeira vez usando)
        console.log('Configuração ainda não definida');
      }
    } catch (err) {
      // Erro silencioso - pode ser que a tabela ainda não exista
      console.log('Configuração não disponível ainda. Execute a migração do Prisma se ainda não fez.');
    } finally {
      setCarregando(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const peso = parseFloat(pesoMedioVenda);
    if (isNaN(peso) || peso <= 0) {
      setMensagem({
        tipo: 'erro',
        texto: 'Por favor, insira um peso médio válido maior que zero.'
      });
      return;
    }

    try {
      setSalvando(true);
      setMensagem(null);

      const response = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chave: 'peso_medio_venda',
          valor: peso
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar configuração');
      }

      const result = await response.json();
      
      setMensagem({
        tipo: 'sucesso',
        texto: '✅ Peso médio de venda salvo com sucesso!'
      });

      // Atualizar o valor no estado
      if (result.valor) {
        setPesoMedioVenda(result.valor);
      }

      // Limpar mensagem após 3 segundos
      setTimeout(() => setMensagem(null), 3000);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao salvar configuração';
      setMensagem({
        tipo: 'erro',
        texto: errorMessage
      });
      console.error('Erro ao salvar configuração:', err);
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
          <Settings className="w-10 h-10" />
          Configurações do Sistema
        </h1>
        <p className="text-gray-600 mt-2">Gerencie as configurações gerais do sistema</p>
      </div>

      {/* Mensagens */}
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

      {/* Formulário de Configuração */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          ⚙️ Peso Médio para Venda
        </h2>
        <p className="text-gray-600 mb-6">
          Defina o peso médio mínimo que um lote deve atingir para ser considerado apto para venda.
          Quando um lote atingir ou ultrapassar este peso médio, ele será marcado como pronto para venda.
        </p>

        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label htmlFor="pesoMedio" className="block text-sm font-medium text-gray-700 mb-2">
              Peso Médio de Venda (kg)
            </label>
            <input
              type="number"
              id="pesoMedio"
              step="0.01"
              min="0"
              value={pesoMedioVenda}
              onChange={(e) => setPesoMedioVenda(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Ex: 350.00"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              💡 Lotes com peso médio igual ou superior a este valor serão marcados como prontos para venda.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {salvando ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>
        </form>
      </div>

      {/* Informações Adicionais */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">ℹ️ Como Funciona</h3>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li>• O sistema calcula automaticamente o peso médio de cada lote baseado no peso dos bois.</li>
          <li>• Quando um lote atinge ou ultrapassa o peso médio configurado, ele é marcado como pronto para venda.</li>
          <li>• Um aviso será exibido na página de vendas quando houver lotes prontos para venda.</li>
          <li>• Você pode alterar este valor a qualquer momento, e o sistema atualizará automaticamente os lotes.</li>
        </ul>
      </div>
    </div>
  );
}

