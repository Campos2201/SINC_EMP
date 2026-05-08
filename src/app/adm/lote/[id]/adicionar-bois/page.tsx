'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

// Tipagem dos Dados
interface Boi {
    id: number;
    peso: number;
}

export default function AdicionarBoisPage() {
    const router = useRouter();
    const params = useParams();
    const loteId = params.id as string;
    
    const [boisParaAdicionar, setBoisParaAdicionar] = useState<Omit<Boi, 'id'>[]>([]);
    const [pesoAtual, setPesoAtual] = useState('');
    const [nomeLote, setNomeLote] = useState(`Lote ${loteId}`);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLoteInfo();
    }, [loteId]);

    const fetchLoteInfo = async () => {
        try {
            const response = await fetch(`/api/lotes/${loteId}`);
            if (response.ok) {
                const data = await response.json();
                setNomeLote(data.codigo);
            }
        } catch (error) {
            console.error('Erro ao buscar informações do lote:', error);
        } finally {
            setLoading(false);
        }
    };

    const adicionarBoi = () => {
        if (pesoAtual && parseFloat(pesoAtual) > 0) {
            setBoisParaAdicionar([...boisParaAdicionar, {
                peso: parseFloat(pesoAtual)
            }]);
            setPesoAtual('');
        } else {
            alert('Por favor, insira um peso válido para o boi.');
        }
    };

    const removerBoi = (index: number) => {
        setBoisParaAdicionar(boisParaAdicionar.filter((_, i) => i !== index));
    };

    const salvarBois = async () => {
        if (boisParaAdicionar.length > 0) {
            try {
                const response = await fetch(`/api/lotes/${loteId}/bois`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        bois: boisParaAdicionar
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao adicionar bois');
                }

                const result = await response.json();
                alert(`${boisParaAdicionar.length} bois adicionados com sucesso ao ${nomeLote}!`);
                router.push('/adm/lote');
            } catch (error) {
                console.error('Erro ao adicionar bois:', error);
                alert('Erro ao adicionar bois: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
            }
        } else {
            alert('Adicione pelo menos um boi antes de salvar.');
        }
    };

    const pesoMedio = boisParaAdicionar.length > 0 
        ? boisParaAdicionar.reduce((acc, boi) => acc + boi.peso, 0) / boisParaAdicionar.length 
        : 0;
    
    const pesoTotal = boisParaAdicionar.reduce((acc, boi) => acc + boi.peso, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-gray-600">Carregando informações do lote...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
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
                        <h1 className="text-3xl font-bold text-gray-800">Adicionar Bois ao {nomeLote}</h1>
                    </div>
                </div>

                {/* Resumo */}
                {boisParaAdicionar.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Resumo dos Bois</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-blue-600 font-medium">Quantidade:</span>
                                <p className="text-gray-800 font-bold">{boisParaAdicionar.length} bois</p>
                            </div>
                            <div>
                                <span className="text-blue-600 font-medium">Peso Total:</span>
                                <p className="text-gray-800 font-bold">{pesoTotal.toFixed(1)} kg</p>
                            </div>
                            <div>
                                <span className="text-blue-600 font-medium">Peso Médio:</span>
                                <p className="text-gray-800 font-bold">{pesoMedio.toFixed(1)} kg</p>
                            </div>
                            <div>
                                <span className="text-blue-600 font-medium">Range de Peso:</span>
                                <p className="text-gray-800 font-bold">
                                    {Math.min(...boisParaAdicionar.map(b => b.peso)).toFixed(1)} - {Math.max(...boisParaAdicionar.map(b => b.peso)).toFixed(1)} kg
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formulário de Adição */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Adicionar Novo Boi</h2>
                    
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Peso do Boi (kg)
                            </label>
                            <input 
                                type="number" 
                                value={pesoAtual}
                                onChange={(e) => setPesoAtual(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="450"
                                step="0.1"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        adicionarBoi();
                                    }
                                }}
                            />
                        </div>
                        <button 
                            onClick={adicionarBoi}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                        >
                            <Plus size={20} />
                            <span>Adicionar Boi</span>
                        </button>
                    </div>
                </div>

                {/* Lista de Bois Adicionados */}
                {boisParaAdicionar.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Bois Adicionados ({boisParaAdicionar.length})</h3>
                            <button
                                onClick={() => setBoisParaAdicionar([])}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                                Limpar Todos
                            </button>
                        </div>
                        
                        <div className="grid gap-3 max-h-96 overflow-y-auto">
                            {boisParaAdicionar.map((boi, idx) => (
                                <div key={idx} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <span className="font-medium text-gray-800">Boi #{idx + 1}</span>
                                        <span className="text-blue-600 font-semibold">{boi.peso} kg</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            boi.peso >= pesoMedio ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {boi.peso >= pesoMedio ? 'Acima da média' : 'Abaixo da média'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removerBoi(idx)}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                        title="Remover boi"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Botões de Ação */}
                <div className="flex gap-4">
                    <button 
                        onClick={() => router.push('/adm/lote')}
                        className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={salvarBois}
                        disabled={boisParaAdicionar.length === 0}
                        className="flex-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        <Save size={20} />
                        <span>Salvar {boisParaAdicionar.length} Bois</span>
                    </button>
                </div>

                {boisParaAdicionar.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <p className="text-yellow-800">
                            Nenhum boi adicionado ainda. Use o formulário acima para adicionar bois ao {nomeLote}.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}