'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

export default function AdicionarMovimentacaoPage() {
  const router = useRouter();
  const params = useParams();
  const remessaId = params.id as string;

  const [tipo, setTipo] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [referente, setReferente] = useState('');
  const [valor, setValor] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const salvarMovimentacao = async () => {
    const valorNumero = Number(valor.replace(',', '.'));

    if (!referente.trim()) {
      alert('Informe o referente da movimentação.');
      return;
    }

    if (!valor || isNaN(valorNumero) || valorNumero <= 0) {
      alert('Informe um valor numérico maior que zero.');
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(/api/remessa//movimentacao, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo,
          descricao: referente.trim(),
          valor: valorNumero,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Erro ao adicionar movimentação');
      }

      alert('Movimentação adicionada com sucesso.');
      router.push('/adm/remessa');
    } catch (error) {
      console.error('Erro ao adicionar movimentação:', error);
      alert('Erro ao adicionar movimentação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <button
            onClick={() => router.push('/adm/remessa')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Voltar para Remessa</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Adicionar Movimentação</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">Nova Movimentação</h2>

          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as 'ENTRADA' | 'SAIDA')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="ENTRADA">ENTRADA</option>
                <option value="SAIDA">SAIDA</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Referente</label>
              <input
                type="text"
                value={referente}
                onChange={(e) => setReferente(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ex: Venda de gado, Compra de ração, Frete"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ex: 2500.00"
                step="0.01"
                min="0"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={salvarMovimentacao}
                disabled={isSaving}
                className="flex-1 bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Salvando...' : 'Salvar Movimentação'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/adm/remessa')}
                className="flex-1 bg-gray-200 text-gray-800 px-5 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
