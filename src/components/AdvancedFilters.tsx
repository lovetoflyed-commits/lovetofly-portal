'use client';

import { useState } from 'react';

interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  minWingspan?: number;
  minLength?: number;
  minHeight?: number;
  hasElectricity?: boolean;
  hasWater?: boolean;
  hasBathroom?: boolean;
  hasSecurity?: boolean;
  acceptsOnlinePayment?: boolean;
  sortBy?: string;
}

interface AdvancedFiltersProps {
  onApplyFilters: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

export default function AdvancedFilters({ onApplyFilters, initialFilters = {} }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    // Count active filters (excluding sortBy)
    const count = Object.entries(filters).filter(([key, value]) => {
      if (key === 'sortBy') return false;
      if (typeof value === 'boolean') return value === true;
      return value !== undefined && value !== null && value !== '';
    }).length;
    
    setActiveFilterCount(count);
    onApplyFilters(filters);
    setIsExpanded(false);
  };

  const handleClear = () => {
    const clearedFilters = { sortBy: filters.sortBy };
    setFilters(clearedFilters);
    setActiveFilterCount(0);
    onApplyFilters(clearedFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 mb-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <div className="text-left">
            <h3 className="font-bold text-slate-800">Filtros Avançados</h3>
            <p className="text-sm text-slate-600">
              {activeFilterCount > 0 
                ? `${activeFilterCount} filtro${activeFilterCount > 1 ? 's' : ''} ativo${activeFilterCount > 1 ? 's' : ''}`
                : 'Refine sua busca'}
            </p>
          </div>
        </div>
        <svg 
          className={`w-6 h-6 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filters Panel */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {/* Price Range */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">💰 Faixa de Preço (Mensal)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mín (R$)"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Máx (R$)"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Size Range */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">📐 Área (m²)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mín"
                  value={filters.minSize || ''}
                  onChange={(e) => handleFilterChange('minSize', e.target.value ? Number(e.target.value) : undefined)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  value={filters.maxSize || ''}
                  onChange={(e) => handleFilterChange('maxSize', e.target.value ? Number(e.target.value) : undefined)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Wingspan */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">✈️ Envergadura Mín. (m)</label>
              <input
                type="number"
                placeholder="Ex: 15"
                value={filters.minWingspan || ''}
                onChange={(e) => handleFilterChange('minWingspan', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Length */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">📏 Comprimento Mín. (m)</label>
              <input
                type="number"
                placeholder="Ex: 12"
                value={filters.minLength || ''}
                onChange={(e) => handleFilterChange('minLength', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Height */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">📊 Altura Mín. (m)</label>
              <input
                type="number"
                placeholder="Ex: 5"
                value={filters.minHeight || ''}
                onChange={(e) => handleFilterChange('minHeight', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">🔀 Ordenar Por</label>
              <select
                value={filters.sortBy || 'date'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Mais Recentes</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
                <option value="size">Maior Área</option>
              </select>
            </div>
          </div>

          {/* Amenities Checkboxes */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h4 className="font-bold text-slate-700 mb-4">🏢 Comodidades</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasElectricity || false}
                  onChange={(e) => handleFilterChange('hasElectricity', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">⚡ Eletricidade</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasWater || false}
                  onChange={(e) => handleFilterChange('hasWater', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">💧 Água</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasBathroom || false}
                  onChange={(e) => handleFilterChange('hasBathroom', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">🚽 Banheiro</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasSecurity || false}
                  onChange={(e) => handleFilterChange('hasSecurity', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">🔒 Segurança</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.acceptsOnlinePayment || false}
                  onChange={(e) => handleFilterChange('acceptsOnlinePayment', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">💳 Pagamento Online</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleApply}
              className="flex-1 px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
