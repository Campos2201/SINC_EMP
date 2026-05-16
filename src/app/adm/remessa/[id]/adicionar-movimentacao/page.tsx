'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const tipos = [
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'SAIDA', label: 'Saida' },
] as const;

type TipoMovimentacao = (typeof tipos)[number]['value'];

export default function AdicionarMovimentacaoPage() {
  const router = useRouter();
  const params = useParams();
  const remessaId = params.id as string;

  const [tipo, setTipo] = useState<TipoMovimentacao>('ENTRADA');
  const [referente, setReferente] = useState('');
  const [valor, setValor] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!referente.trim()) {
      setError('Informe o referente da movimentacao.');
      return;
    }

    const valorNumero = Number(valor.replace(',', '.'));
    if (Number.isNaN(valorNumero) || valorNumero <= 0) {
      setError('Informe um valor valido maior que zero.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/remessa/${remessaId}/movimentacao`, {
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
        const body = await response.json().catch(() => null);
        const message = body?.message || 'Erro ao salvar movimentacao.';
        throw new Error(message);
      }

      router.push('/adm/remessa');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push('/adm/remessa')}
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Voltar para Remessas
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Nova Movimentação</h1>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-gray-700">
                Tipo
                <select
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value as TipoMovimentacao)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {tipos.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-gray-700 sm:col-span-2">
                Referente
                <input
                  type="text"
                  value={referente}
                  onChange={(event) => setReferente(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Ex: conta de água, conta de luz"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-gray-700 sm:col-span-2">
                Valor
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valor}
                  onChange={(event) => setValor(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="0,00"
                />
              </label>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => router.push('/adm/remessa')}
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {saving ? 'Salvando...' : 'Salvar Movimentacao'}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-6 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">Observação</p>
          <p className="mt-2">
            Informe se é entrada ou saida, ao que se refere e um valor valido.
          </p>
        </div>
      </div>
    </div>
  );
}
