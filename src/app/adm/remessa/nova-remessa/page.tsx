'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

export default function Page() {
    const router = useRouter();
    const [mes, setMes] = useState('');
    const [ano, setAno] = useState(new Date().getFullYear().toString());
    const [status, setStatus] = useState('ABERTO');
    const [isSaving, setIsSaving] = useState(false);

    const salvarRemessa = async () => {
        const mesNumero = parseInt(mes, 10);
        const anoNumero = parseInt(ano, 10);

        if (!mes || isNaN(mesNumero) || mesNumero < 1 || mesNumero > 12) {
            alert('Informe um mês válido entre 1 e 12.');
            return;
        }

        if (!ano || isNaN(anoNumero) || anoNumero < 2026 || anoNumero > 9999) {
            alert('Informe um ano válido.');
            return;
        }

        if (!status) {
            alert('Informe o status da remessa.');
            return;
        }

        try {
            setIsSaving(true);

            const response = await fetch('/api/remessa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mes: mesNumero,
                    ano: anoNumero,
                    status,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar remessa');
            }

            await response.json();
            alert('Remessa criada com sucesso!');
            router.push('/adm/remessa');
        } catch (error) {
            console.error('Erro ao criar remessa:', error);
            alert('Erro ao criar remessa: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/adm/remessa')}
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Voltar para Remessa</span>
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800">Criar Nova Remessa</h1>
                    </div>
                </div>

                {/* Formulário */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Informações da Remessa</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mês *
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={12}
                                value={mes}
                                onChange={(e) => setMes(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Ex: 5"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ano *
                            </label>
                            <input
                                type="number"
                                min={2000}
                                max={2100}
                                value={ano}
                                onChange={(e) => setAno(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Ex: 2026"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status *
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="ABERTO">ABERTO</option>
                                <option value="FECHADO">FECHADO</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={() => router.push('/adm/remessa')}
                            className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={salvarRemessa}
                            disabled={!mes || !ano || isSaving}
                            className="flex-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            <Save size={20} />
                            <span>{isSaving ? 'Salvando...' : 'Criar Remessa'}</span>
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 text-sm">
                            <strong>Próximo passo:</strong> após criar a remessa, você poderá gerenciar movimentações e ver o fechamento do mês.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
