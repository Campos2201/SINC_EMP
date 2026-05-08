'use client';

import React, { useState } from 'react';

interface RelatorioTableProps {
  tipo: 'lotes' | 'vendas' | 'lucro' | 'analise-completa';
  dados: any[];
  resumo?: {
    [key: string]: string | number;
  };
}

export default function RelatorioTable({ tipo, dados, resumo }: RelatorioTableProps) {
  const [colunasOcultas, setColunasOcultas] = useState<Set<string>>(new Set());

  if (!dados || dados.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum dado encontrado para os filtros selecionados.</p>
      </div>
    );
  }

  const colunas = Object.keys(dados[0]);
  const colunasVisiveis = colunas.filter(col => !colunasOcultas.has(col));

  const toggleColunaOculta = (coluna: string) => {
    const novas = new Set(colunasOcultas);
    if (novas.has(coluna)) {
      novas.delete(coluna);
    } else {
      novas.add(coluna);
    }
    setColunasOcultas(novas);
  };

  const getHeaderLabel = (coluna: string): string => {
    const labels: Record<string, string> = {
      id: 'ID',
      codigo: 'Código',
      dataChegada: 'Data Chegada',
      quantidadeBois: 'Qtd Bois',
      pesoTotal: 'Peso Total (kg)',
      pesoMedio: 'Peso Médio (kg)',
      custo: 'Custo (R$)',
      custoBois: 'Custo Bois (R$)',
      vacinado: 'Vacinado',
      dataVenda: 'Data Venda',
      valor: 'Valor (R$)',
      lote: 'Lote',
      lucro: 'Lucro (R$)',
      margemLucro: 'Margem (%)',
      lucroPorBoi: 'Lucro/Boi (R$)',
      pesoMedioGeral: 'Peso Médio Geral',
      valorVenda: 'Valor Venda (R$)',
      status: 'Status',
      lucroTotal: 'Lucro Total (R$)'
    };
    return labels[coluna] || coluna.replace(/([A-Z])/g, ' $1').trim();
  };

  const exportarCSV = () => {
    const headers = colunasVisiveis.map(col => `"${getHeaderLabel(col)}"`).join(',');
    const rows = dados.map(row =>
      colunasVisiveis.map(col => {
        const valor = row[col];
        const stringValor = String(valor);
        return `"${stringValor.replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-${tipo}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarJSON = () => {
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-${tipo}-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Controles de Tabela */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportarCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            📥 Exportar CSV
          </button>
          <button
            onClick={exportarJSON}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            📥 Exportar JSON
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-700 font-medium">📊 {dados.length} registros</span>
        </div>
      </div>

      {/* Seletor de Colunas */}
      <details className="bg-gray-50 rounded-lg p-4">
        <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
          🔧 Mostrar/Ocultar Colunas
        </summary>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {colunas.map(coluna => (
            <label key={coluna} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!colunasOcultas.has(coluna)}
                onChange={() => toggleColunaOculta(coluna)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">{getHeaderLabel(coluna)}</span>
            </label>
          ))}
        </div>
      </details>

      {/* Tabela */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white sticky top-0">
            <tr>
              {colunasVisiveis.map(coluna => (
                <th key={coluna} className="px-4 py-3 text-left font-semibold">
                  {getHeaderLabel(coluna)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.map((row, idx) => (
              <tr
                key={idx}
                className={`border-t ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-gray-100 transition`}
              >
                {colunasVisiveis.map(coluna => (
                  <td key={coluna} className="px-4 py-3 text-gray-800">
                    {formatarValor(row[coluna], coluna)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumo Estatístico */}
      {resumo && Object.keys(resumo).length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">📈 Resumo Estatístico</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(resumo).map(([chave, valor]) => (
              <div key={chave} className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                <p className="text-sm text-gray-600 font-medium">
                  {formatarChave(chave)}
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatarValor(valor, chave)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatarValor(valor: any, campo: string): string {
  if (valor === null || valor === undefined) return '-';

  // Se é data - verificar PRIMEIRO antes de verificar valores monetários
  // porque "dataVenda" contém "venda" mas é uma data, não um valor
  if (campo.toLowerCase().includes('data')) {
    // Se já está formatado como data (DD/MM/YYYY) ou é "Não vendido", retorna como está
    if (String(valor).match(/^\d{2}\/\d{2}\/\d{4}$/) || String(valor) === 'Não vendido') {
      return String(valor);
    }
    // Se é uma data ISO ou timestamp, formata
    try {
      const data = new Date(valor);
      if (!isNaN(data.getTime())) {
        return data.toLocaleDateString('pt-BR');
      }
    } catch {
      // Se não conseguir parsear, retorna como string
    }
    return String(valor);
  }

  // Se é percentual ou margem
  if (campo.includes('Margem') || campo.includes('margem') || String(valor).endsWith('%')) {
    return String(valor);
  }

  // Se é valor monetário (mas não dataVenda que já foi tratado acima)
  if (
    campo.toLowerCase().includes('custo') ||
    campo.toLowerCase().includes('valor') ||
    campo.toLowerCase().includes('lucro') ||
    campo.toLowerCase().includes('preco') ||
    (campo.toLowerCase().includes('venda') && !campo.toLowerCase().includes('data'))
  ) {
    const num = parseFloat(String(valor));
    if (!isNaN(num)) {
      return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  // Se é peso (kg)
  if (
    campo.toLowerCase().includes('peso') ||
    campo.toLowerCase().includes('kg')
  ) {
    const num = parseFloat(String(valor));
    if (!isNaN(num)) {
      return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
    }
  }

  return String(valor);
}

function formatarChave(chave: string): string {
  const mapa: Record<string, string> = {
    totalRegistros: 'Total de Registros',
    custoTotal: 'Custo Total',
    quantidadeTotal: 'Quantidade Total',
    pesoMedioGeral: 'Peso Médio Geral',
    valorTotal: 'Valor Total',
    lucroTotal: 'Lucro Total',
    lucroTotalGeral: 'Lucro Total Geral',
    margemMédia: 'Margem Média',
    lucroPorBoiMédio: 'Lucro por Boi (Médio)',
    totalBois: 'Total de Bois',
    custosTotal: 'Custos Totais',
    vendasTotal: 'Total de Vendas'
  };
  return mapa[chave] || chave;
}
