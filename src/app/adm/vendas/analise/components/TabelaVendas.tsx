'use client';

import React, { useState } from 'react';

interface TabelaVendasProps {
  dados: any[];
  metricas: string[];
}

export default function TabelaVendas({ dados, metricas }: TabelaVendasProps) {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  if (!dados || dados.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum dado disponível</p>
      </div>
    );
  }

  const totalPaginas = Math.ceil(dados.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const dadosPaginados = dados.slice(inicio, fim);

  const colunas = Object.keys(dadosPaginados[0] || {});
  const colunasVisiveis = colunas.filter(col => !col.startsWith('_'));

  // Função para formatar data sem problemas de timezone
  const formatarData = (dataString: string): string => {
    try {
      if (typeof dataString === 'string') {
        if (dataString.includes('T')) {
          const [dataPart] = dataString.split('T');
          const [ano, mes, dia] = dataPart.split('-');
          return `${dia}/${mes}/${ano}`;
        }
        if (dataString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [ano, mes, dia] = dataString.split('-');
          return `${dia}/${mes}/${ano}`;
        }
      }
      const data = new Date(dataString);
      if (!isNaN(data.getTime())) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      return String(dataString);
    } catch {
      return String(dataString);
    }
  };

  const formatarValor = (valor: any, coluna: string): string => {
    if (valor === null || valor === undefined) return '-';

    // Se for data, formata corretamente
    if (coluna.toLowerCase().includes('data')) {
      return formatarData(valor);
    }

    if (coluna.includes('valor') || coluna.includes('lucro')) {
      const num = parseFloat(String(valor));
      if (!isNaN(num)) {
        return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }

    if (coluna.includes('margem')) {
      const num = parseFloat(String(valor));
      if (!isNaN(num)) {
        return `${num.toFixed(2)}%`;
      }
    }

    return String(valor);
  };

  const obterLabel = (coluna: string): string => {
    const labels: Record<string, string> = {
      id: 'ID',
      data: 'Data',
      lote: 'Lote',
      valor: 'Valor (R$)',
      quantidade: 'Quantidade',
      lucro: 'Lucro (R$)',
      margem: 'Margem (%)'
    };
    return labels[coluna] || coluna;
  };

  const exportarCSV = () => {
    const headers = colunasVisiveis.map(col => `"${obterLabel(col)}"`).join(',');
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
    link.setAttribute('download', `vendas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex gap-2">
          <button
            onClick={exportarCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            📥 Exportar CSV
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
          📊 {dados.length} registros totais
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0">
            <tr>
              {colunasVisiveis.map(coluna => (
                <th key={coluna} className="px-4 py-3 text-left font-semibold">
                  {obterLabel(coluna)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dadosPaginados.map((row, idx) => (
              <tr
                key={idx}
                className={`border-t ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-blue-50 transition`}
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

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
            disabled={paginaAtual === 1}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            ← Anterior
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => setPaginaAtual(num)}
              className={`px-3 py-2 rounded-lg transition ${
                paginaAtual === num
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
            disabled={paginaAtual === totalPaginas}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Próximo →
          </button>

          <span className="ml-4 text-sm text-gray-600 font-medium">
            Página {paginaAtual} de {totalPaginas}
          </span>
        </div>
      )}
    </div>
  );
}
