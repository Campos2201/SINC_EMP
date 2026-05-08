'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

// Tipagem dos Dados
interface Boi {
    id: number;
    peso: number;
}

interface Lote {
    id: number;
    nome: string;
    dataChegada: string;
    gasto_alimentacao?: number | null;
    custo: number;
    vacinado: boolean;
    dataVacinacao: string | null;
    bois: Boi[];
}

export default function NovoLotePage() {
    const router = useRouter();
    const [nomeLote, setNomeLote] = useState('');
    const [dataChegada, setDataChegada] = useState('');
    const [custoLote, setCustoLote] = useState('');
    const [gastoAlimentacao, setGastoAlimentacao] = useState(''); // <-- novo
    const [vacinadoLote, setVacinadoLote] = useState(false);
    const [dataVacinacao, setDataVacinacao] = useState('');

    const salvarLote = async () => {
        // Validar datas (não podem ser futuras)
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        if (dataChegada) {
            const dataChegadaObj = new Date(dataChegada);
            dataChegadaObj.setHours(0, 0, 0, 0);
            if (dataChegadaObj > hoje) {
                alert('A data de chegada não pode ser futura');
                return;
            }
        }
        
        if (vacinadoLote && dataVacinacao) {
            const dataVacinacaoObj = new Date(dataVacinacao);
            dataVacinacaoObj.setHours(0, 0, 0, 0);
            if (dataVacinacaoObj > hoje) {
                alert('A data de vacinação não pode ser futura');
                return;
            }
        }
        
        if (nomeLote && dataChegada && custoLote && (!vacinadoLote || dataVacinacao)) {
            try {
                const response = await fetch('/api/lotes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        codigo: nomeLote,
                        chegada: dataChegada,
                        custo: parseFloat(custoLote),
                        gasto_alimentacao: gastoAlimentacao === '' ? null : parseFloat(gastoAlimentacao), // <-- enviado
                        vacinado: vacinadoLote,
                        data_vacinacao: vacinadoLote ? dataVacinacao : null
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao criar lote');
                }

                const result = await response.json();
                alert('Lote criado com sucesso! Agora você pode adicionar bois a ele.');
                router.push('/adm/lote');
            } catch (error) {
                console.error('Erro ao criar lote:', error);
                alert('Erro ao criar lote: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
            }
        } else {
            alert('Preencha todos os campos obrigatórios. Se o lote foi vacinado, informe a data da vacinação.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/adm/lote')}
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Voltar aos Lotes</span>
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800">Criar Novo Lote</h1>
                    </div>
                </div>

                {/* Formulário */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Informações do Lote</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome do Lote *
                            </label>
                            <input 
                                type="text" 
                                value={nomeLote}
                                onChange={(e) => setNomeLote(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="Ex: Lote D - Nelore"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Data de Chegada *
                            </label>
                            <input 
                                type="date" 
                                value={dataChegada}
                                onChange={(e) => setDataChegada(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Custo Total do Lote (R$) *
                            </label>
                            <input 
                                type="number" 
                                value={custoLote}
                                onChange={(e) => setCustoLote(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="50000"
                                step="0.01"
                            />
                        </div>

                        {/* novo campo gasto com alimentação */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gasto com Alimentação (R$)
                            </label>
                            <input
                                type="number"
                                value={gastoAlimentacao}
                                onChange={(e) => setGastoAlimentacao(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ex: 1200.50"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lote Vacinado?
                            </label>
                            <select 
                                value={String(vacinadoLote)}
                                onChange={(e) => setVacinadoLote(e.target.value === 'true')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="false">Não</option>
                                <option value="true">Sim</option>
                            </select>
                        </div>

                        {vacinadoLote && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Data da Vacinação do Lote
                                </label>
                                <input 
                                    type="date" 
                                    value={dataVacinacao}
                                    onChange={(e) => setDataVacinacao(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                />
                            </div>
                        )}
                    </div>

                    {/* Botões */}
                    <div className="flex gap-4 mt-8">
                        <button 
                            onClick={() => router.push('/adm/lotes')}
                            className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={salvarLote}
                            disabled={!nomeLote || !dataChegada || !custoLote || (vacinadoLote && !dataVacinacao)}
                            className="flex-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            <Save size={20} />
                            <span>Criar Lote</span>
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                            <strong>Próximo passo:</strong> Após criar o lote, você poderá adicionar bois a ele através do botão "Adicionar Bois" na página de lotes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}