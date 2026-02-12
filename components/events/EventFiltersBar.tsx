'use client';

import { useState } from 'react';
import { EventFilters, EventCategory } from '@/types/event';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface EventFiltersBarProps {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
}

const categories: { value: EventCategory; label: string; icon: string }[] = [
  { value: 'campus', label: 'Campus', icon: '🎓' },
  { value: 'concert', label: 'Concert', icon: '🎵' },
  { value: 'festival', label: 'Festival', icon: '🎉' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'comedy', label: 'Comedy', icon: '😂' },
  { value: 'networking', label: 'Networking', icon: '🤝' },
  { value: 'other', label: 'Other', icon: '🎭' },
];

const cities = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Machakos',
  'Kiambu',
];

export default function EventFiltersBar({ filters, onChange }: EventFiltersBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priceRange, setPriceRange] = useState({
    min: filters.priceMin || 0,
    max: filters.priceMax || 10000,
  });

  const updateFilter = (key: keyof EventFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({});
    setPriceRange({ min: 0, max: 10000 });
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="mb-8 space-y-4">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => updateFilter('category', undefined)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            !filters.category
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          All Events
        </button>
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => updateFilter('category', category.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filters.category === category.value
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span>{category.icon}</span>
            {category.label}
          </button>
        ))}
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <FunnelIcon className="h-5 w-5" />
          {showAdvanced ? 'Hide Filters' : 'More Filters'}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <select
                value={filters.city || ''}
                onChange={(e) => updateFilter('city', e.target.value || undefined)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                  onBlur={() => updateFilter('priceMin', priceRange.min || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                  onBlur={() => updateFilter('priceMax', priceRange.max || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Virtual Only Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ticket Type
              </label>
              <button
                onClick={() => updateFilter('hasVirtualTickets', filters.hasVirtualTickets ? undefined : true)}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.hasVirtualTickets
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filters.hasVirtualTickets ? '📺 Virtual Only' : 'All Tickets'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
