import React from 'react';

// Tipagem dos Dados (remover se já tipado no arquivo principal)
export interface Venda {
    id: number;
    loteId: number;
    loteName: string;
    data: string;
    valor: number;
}

export interface Boi {
    id: number;
    peso: number;
    vacinado: boolean;
    dataVacinacao: string | null;
}

export interface Lote {
    id: number;
    nome: string;
    dataChegada: string;
    custo: number;
    bois: Boi[];
}

const HomePage = () => {
  // Dados mockados temporariamente - depois você pode buscar do banco de dados
  const lotes: Lote[] = [
    {
      id: 1,
      nome: "Lote A",
      dataChegada: "2024-01-15",
      custo: 50000,
      bois: [
        { id: 1, peso: 450, vacinado: true, dataVacinacao: "2024-01-20" },
        { id: 2, peso: 480, vacinado: false, dataVacinacao: null }
      ]
    }
  ];

  const vendas: Venda[] = [
    { id: 1, loteId: 1, loteName: "Lote A", data: "2024-02-01", valor: 75000 }
  ];

  const totalBois = lotes.reduce((acc, lote) => acc + lote.bois.length, 0);
  const totalVendasValor = vendas.reduce((acc, v) => acc + v.valor, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Bem-vindo ao Sistema de Controle de Gado</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Total de Lotes</h3>
          <p className="text-4xl font-bold text-green-600">{lotes.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Total de Bois</h3>
          <p className="text-4xl font-bold text-blue-600">{totalBois}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-600">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Total Vendas</h3>
          <p className="text-4xl font-bold text-yellow-600">R$ {totalVendasValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;