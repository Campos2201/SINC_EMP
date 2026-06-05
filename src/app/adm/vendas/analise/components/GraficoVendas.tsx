'use client';

import React from 'react';
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface GraficoVendasProps {
  dados: any[];
  tipo: 'linha' | 'barra' | 'pizza' | 'area';
  metricas: string[];
}

const CORES = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function GraficoVendas({ dados, tipo, metricas }: GraficoVendasProps) {
  if (!dados || dados.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-lg font-medium">📊 Nenhum dado disponível para o gráfico</p>
        <p className="text-gray-400 text-sm mt-2">Ajuste os filtros ou verifique se há vendas no período selecionado</p>
      </div>
    );
  }

  const renderizarGrafico = () => {
    switch (tipo) {
      case 'linha':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={dados} margin={{ top: 10, right: 30, left: 10, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="nome" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => {
                  if (typeof value === 'number') {
                    return value.toFixed(2);
                  }
                  return value;
                }}
                contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
              />
              <Legend />
              {metricas.includes('valor') && (
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke={CORES[0]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Valor (R$)"
                />
              )}
              {metricas.includes('lucro') && (
                <Line
                  type="monotone"
                  dataKey="lucro"
                  stroke={CORES[1]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Lucro (R$)"
                />
              )}
              {metricas.includes('quantidade') && (
                <Line
                  type="monotone"
                  dataKey="quantidade"
                  stroke={CORES[2]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Quantidade"
                />
              )}
              {metricas.includes('margem') && (
                <Line
                  type="monotone"
                  dataKey="margem"
                  stroke={CORES[3]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Margem (%)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'barra':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={dados} margin={{ top: 10, right: 30, left: 10, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="nome" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => {
                  if (typeof value === 'number') {
                    return value.toFixed(2);
                  }
                  return value;
                }}
                contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
              />
              <Legend />
              {metricas.includes('valor') && (
                <Bar dataKey="valor" fill={CORES[0]} name="Valor (R$)" />
              )}
              {metricas.includes('lucro') && (
                <Bar dataKey="lucro" fill={CORES[1]} name="Lucro (R$)" />
              )}
              {metricas.includes('quantidade') && (
                <Bar dataKey="quantidade" fill={CORES[2]} name="Quantidade" />
              )}
              {metricas.includes('margem') && (
                <Bar dataKey="margem" fill={CORES[3]} name="Margem (%)" />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <AreaChart data={dados} margin={{ top: 10, right: 30, left: 10, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="nome" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => {
                  if (typeof value === 'number') {
                    return value.toFixed(2);
                  }
                  return value;
                }}
                contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
              />
              <Legend />
              {metricas.includes('valor') && (
                <Area
                  type="monotone"
                  dataKey="valor"
                  fill={CORES[0]}
                  stroke={CORES[0]}
                  fillOpacity={0.3}
                  name="Valor (R$)"
                />
              )}
              {metricas.includes('lucro') && (
                <Area
                  type="monotone"
                  dataKey="lucro"
                  fill={CORES[1]}
                  stroke={CORES[1]}
                  fillOpacity={0.3}
                  name="Lucro (R$)"
                />
              )}
              {metricas.includes('quantidade') && (
                <Area
                  type="monotone"
                  dataKey="quantidade"
                  fill={CORES[2]}
                  stroke={CORES[2]}
                  fillOpacity={0.3}
                  name="Quantidade"
                />
              )}
              {metricas.includes('margem') && (
                <Area
                  type="monotone"
                  dataKey="margem"
                  fill={CORES[3]}
                  stroke={CORES[3]}
                  fillOpacity={0.3}
                  name="Margem (%)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pizza':
        // Para pizza, pegamos apenas a primeira métrica e usamos os dados do primeiro período
        const metricaPizza = metricas[0] || 'valor';
        const dadosPizza = dados.slice(0, 5).map((d: any) => ({
          name: d.nome,
          value: d[metricaPizza as keyof typeof d] || 0
        }));

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={dadosPizza}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }: any) => `${name}: ${(value as number).toFixed(2)}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {dadosPizza.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => {
                  if (typeof value === 'number') {
                    return value.toFixed(2);
                  }
                  return value;
                }}
                contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="text-center py-8 text-gray-500">Tipo de gráfico não suportado</div>;
    }
  };

  return (
    <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200">
      {renderizarGrafico()}
    </div>
  );
}
