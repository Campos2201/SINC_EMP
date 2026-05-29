'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

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
  movimentacoes: Movimentacao[];
  _count: {
    movimentacoes: number;
  };
}

const nomesMeses = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const formatarMes = (mes: number) => nomesMeses[mes - 1] || 'Mês inválido';

export default function RemessaDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const remessaId = params.id as string;

  const [remessa, setRemessa] = useState<Remessa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMovimentacao, setEditingMovimentacao] = useState<Movimentacao | null>(null);
  const [editForm, setEditForm] = useState({ descricao: '', tipo: 'ENTRADA' as 'ENTRADA' | 'SAIDA', valor: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const carregarRemessa = async () => {
    try {
      const response = await fetch(`/api/remessa/${remessaId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Erro ao carregar remessa');
      }

      const data = await response.json();
      setRemessa(data);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar remessa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      await carregarRemessa();
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [remessaId]);

  const totais = useMemo(() => {
    if (!remessa) {
      return { gastos: 0, ganhos: 0, saldo: 0 };
    }

    const gastos = remessa.movimentacoes
      .filter((mov) => mov.tipo === 'SAIDA')
      .reduce((acc, mov) => acc + Number(mov.valor), 0);

    const ganhos = remessa.movimentacoes
      .filter((mov) => mov.tipo === 'ENTRADA')
      .reduce((acc, mov) => acc + Number(mov.valor), 0);

    return {
      gastos,
      ganhos,
      saldo: ganhos - gastos,
    };
  }, [remessa]);

  const abrirEdicaoMovimentacao = (movimentacao: Movimentacao) => {
    setEditingMovimentacao(movimentacao);
    setEditForm({
      descricao: movimentacao.descricao,
      tipo: movimentacao.tipo,
      valor: Number(movimentacao.valor).toFixed(2),
    });
  };

  const salvarEdicaoMovimentacao = async () => {
    if (!editingMovimentacao) return;

    const valorNumero = Number(editForm.valor.replace(',', '.'));

    if (!editForm.descricao.trim()) {
      alert('Informe a descrição da movimentação.');
      return;
    }

    if (Number.isNaN(valorNumero) || valorNumero <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }

    try {
      setIsSavingEdit(true);

      const response = await fetch(`/api/remessa/${remessaId}/movimentacao/${editingMovimentacao.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          descricao: editForm.descricao.trim(),
          tipo: editForm.tipo,
          valor: valorNumero,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Erro ao atualizar movimentação');
      }

      await carregarRemessa();
      setEditingMovimentacao(null);
      alert('Movimentação atualizada com sucesso.');
    } catch (error) {
      console.error('Erro ao atualizar movimentação:', error);
      alert('Erro ao atualizar movimentação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 text-center text-gray-600">
            Carregando detalhes da remessa...
          </div>
        </div>
      </div>
    );
  }

  if (error || !remessa) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <p className="text-red-600 font-medium">{error || 'Remessa não encontrada.'}</p>
            <button
              type="button"
              onClick={() => router.push('/adm/remessa')}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
            >
              Voltar para remessas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/adm/remessa')}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Voltar para Remessa</span>
            </button>
            <div>
              <p className="text-sm font-medium text-gray-500">Detalhes da remessa</p>
              <h1 className="text-3xl font-bold text-gray-900">{formatarMes(remessa.mes)} / {remessa.ano}</h1>
            </div>
          </div>

          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${remessa.status === 'ABERTO' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
            {remessa.status}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Total de ganhos</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              R$ {totais.ganhos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Total de gastos</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              R$ {totais.gastos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Saldo da remessa</p>
            <p className={`mt-2 text-2xl font-bold ${totais.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {totais.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Movimentações do mês</h2>
              <p className="text-sm text-gray-500">Registros financeiros desta remessa.</p>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {remessa._count.movimentacoes} movimentação{remessa._count.movimentacoes === 1 ? '' : 's'}
            </span>
          </div>

          {remessa.movimentacoes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-600">
              Nenhuma movimentação registrada para esta remessa.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Descrição</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Valor</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {remessa.movimentacoes.map((movimentacao) => (
                    <tr key={movimentacao.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(movimentacao.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${movimentacao.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {movimentacao.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{movimentacao.descricao}</td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${movimentacao.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {Number(movimentacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <button
                          type="button"
                          onClick={() => abrirEdicaoMovimentacao(movimentacao)}
                          className="rounded bg-amber-500 px-3 py-1.5 font-medium text-white hover:bg-amber-600"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingMovimentacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Editar movimentação</h2>
              <p className="mt-1 text-sm text-gray-500">Atualize a descrição, tipo ou valor desta entrada/saída.</p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={editForm.tipo}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, tipo: e.target.value as 'ENTRADA' | 'SAIDA' }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-500"
                >
                  <option value="ENTRADA">ENTRADA</option>
                  <option value="SAIDA">SAIDA</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Descrição</label>
                <input
                  type="text"
                  value={editForm.descricao}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, descricao: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Venda de gado"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.valor}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, valor: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setEditingMovimentacao(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarEdicaoMovimentacao}
                disabled={isSavingEdit}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
              >
                {isSavingEdit ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
