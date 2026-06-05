'use client';

import { useEffect, useMemo, useState } from 'react';

interface Reserva {
  id: number;
  tipo: 'ENTRADA' | 'SAIDA';
  valor: string;
  createdAt: string;
  user?: {
    name?: string;
  };
}

const initialFormState = {
  tipo: 'ENTRADA' as 'ENTRADA' | 'SAIDA',
  valor: '',
};

export default function ReservaPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadReservas();
  }, []);

  const loadReservas = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reserva');
      if (!response.ok) {
        throw new Error(`Erro ao carregar reservas (${response.status})`);
      }

      const data = await response.json();
      setReservas(data);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const valorNumero = Number(form.valor.replace(',', '.'));

    if (Number.isNaN(valorNumero) || valorNumero <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }

    const payload = {
      tipo: form.tipo,
      valor: valorNumero,
    };

    try {
      setSaving(true);
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/reserva/${editingId}` : '/api/reserva';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao ${editingId ? 'atualizar' : 'adicionar'} reserva`);
      }

      await loadReservas();
      setForm(initialFormState);
      setEditingId(null);
      setSuccess(editingId ? 'Reserva atualizada com sucesso.' : 'Reserva adicionada com sucesso.');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reserva: Reserva) => {
    setEditingId(reserva.id);
    setForm({
      tipo: reserva.tipo,
      valor: Number(reserva.valor).toFixed(2),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Deseja realmente excluir esta entrada/saída da reserva?');
    if (!confirmed) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/reserva/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao excluir reserva');
      }

      await loadReservas();
      setSuccess('Reserva excluída com sucesso.');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(initialFormState);
    setError(null);
    setSuccess(null);
  };

  const resumo = useMemo(() => {
    const totalEntradas = reservas
      .filter((item) => item.tipo === 'ENTRADA')
      .reduce((acc, item) => acc + Number(item.valor), 0);
    const totalSaidas = reservas
      .filter((item) => item.tipo === 'SAIDA')
      .reduce((acc, item) => acc + Number(item.valor), 0);

    return {
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
    };
  }, [reservas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reserva Financeira</h1>
          <p className="mt-1 text-gray-600">Adicione, edite ou remova valores da reserva compartilhada da empresa.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Entradas</p>
          <p className="mt-3 text-3xl font-bold text-green-600">
            R$ {resumo.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Saídas</p>
          <p className="mt-3 text-3xl font-bold text-red-600">
            R$ {resumo.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${resumo.saldo >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <p className="text-sm text-gray-500">Saldo</p>
          <p className={`mt-3 text-3xl font-bold ${resumo.saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            R$ {resumo.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">{editingId ? 'Editar registro' : 'Adicionar novo registro'}</h2>
          <p className="mt-2 text-sm text-gray-500">Use este formulário para registrar entrada ou saída na reserva.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{success}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              >
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Valor</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="valor"
                value={form.valor}
                onChange={handleInputChange}
                placeholder="0.00"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {saving ? 'Salvando...' : editingId ? 'Atualizar registro' : 'Adicionar à reserva'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Movimentações da reserva</h2>
              <p className="mt-1 text-sm text-gray-500">Veja todas as entradas e saídas registradas.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{reservas.length} registro{reservas.length === 1 ? '' : 's'}</span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-600">Carregando registros...</div>
          ) : reservas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-600">Nenhuma movimentação cadastrada ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-gray-700">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {reservas.map((reserva) => (
                    <tr key={reserva.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(reserva.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${reserva.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {reserva.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        R$ {Number(reserva.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-sm space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(reserva)}
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-white hover:bg-amber-600"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(reserva.id)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
