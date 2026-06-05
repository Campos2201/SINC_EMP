'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Filter, X } from 'lucide-react';

export interface FilterColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: { value: string; label: string }[];
}

interface TableFilterProps<T> {
  data: T[];
  columns: FilterColumn[];
  onFilterChange: (filteredData: T[]) => void;
  placeholder?: string;
}

export function TableFilter<T extends Record<string, any>>({
  data,
  columns,
  onFilterChange,
  placeholder = 'Filtrar informações...'
}: TableFilterProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filteredData = useMemo(() => {
    let result = [...data];

    columns.forEach((column) => {
      const filterValue = filters[column.key]?.toLowerCase().trim();
      if (!filterValue) return;

      result = result.filter((item) => {
        const value = item[column.key];
        
        if (value === null || value === undefined) return false;

        switch (column.type) {
          case 'text':
            return String(value).toLowerCase().includes(filterValue);
          
          case 'number':
            const numValue = parseFloat(filterValue);
            if (isNaN(numValue)) return true;
            const itemNum = parseFloat(String(value));
            return !isNaN(itemNum) && itemNum === numValue;
          
          case 'date':
            const filterDate = new Date(filterValue);
            const itemDate = new Date(value);
            return itemDate.toDateString() === filterDate.toDateString();
          
          case 'select':
            const itemValue = String(value).toLowerCase().trim();
            return itemValue === filterValue || itemValue.includes(filterValue);
          
          default:
            return true;
        }
      });
    });

    return result;
  }, [data, filters, columns]);

  // Atualiza o componente pai apenas quando filters ou data mudarem
  // Usa useRef para evitar loops infinitos
  const onFilterChangeRef = useRef(onFilterChange);
  
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  // Atualiza apenas quando filters ou data mudarem, não quando filteredData mudar
  useEffect(() => {
    onFilterChangeRef.current(filteredData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, data]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilter = (key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const activeFiltersCount = Object.keys(filters).filter(key => filters[key]?.trim()).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        title="Filtrar informações"
      >
        <Filter className="h-5 w-5" />
        <span>Filtrar</span>
        {activeFiltersCount > 0 && (
          <span className="bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-semibold">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {columns.map((column) => (
                <div key={column.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {column.label}
                  </label>
                  {column.type === 'select' && column.options ? (
                    <select
                      value={filters[column.key] || ''}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Todos</option>
                      {column.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : column.type === 'date' ? (
                    <input
                      type="date"
                      value={filters[column.key] || ''}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : column.type === 'number' ? (
                    <input
                      type="number"
                      value={filters[column.key] || ''}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={filters[column.key] || ''}
                        onChange={(e) => handleFilterChange(column.key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                      />
                      {filters[column.key] && (
                        <button
                          onClick={() => clearFilter(column.key)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {activeFiltersCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={clearAllFilters}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
              Mostrando {filteredData.length} de {data.length} registros
            </div>
          </div>
        </>
      )}
    </div>
  );
}

