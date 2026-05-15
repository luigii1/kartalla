'use client';

import { EventCategory, CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/types';

export type SortOption = 'date_asc' | 'date_desc' | 'name_asc';

export interface Filters {
  categories: Set<EventCategory>;
  dateFrom: string;
  dateTo: string;
  sort: SortOption;
}

export const ALL_CATEGORIES: EventCategory[] = ['music', 'sports', 'food', 'culture', 'other'];

export function defaultFilters(): Filters {
  return {
    categories: new Set(ALL_CATEGORIES),
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: '',
    sort: 'date_asc',
  };
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  total: number;
  filtered: number;
}

export default function FilterBar({ filters, onChange, total, filtered }: FilterBarProps) {
  const toggleCategory = (cat: EventCategory) => {
    const next = new Set(filters.categories);
    if (next.has(cat)) {
      if (next.size > 1) next.delete(cat);
    } else {
      next.add(cat);
    }
    onChange({ ...filters, categories: next });
  };

  return (
    <div className="border-b border-gray-200 px-3 py-2.5 flex flex-col gap-2 flex-shrink-0">
      {/* Kategoriat */}
      <div className="flex flex-wrap gap-1">
        {ALL_CATEGORIES.map((cat) => {
          const active = filters.categories.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                active ? 'text-white border-transparent' : 'bg-white text-gray-400 border-gray-200'
              }`}
              style={active ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* Päivämääräväli + lajittelu */}
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 flex-1 min-w-0"
        />
        <span className="text-xs text-gray-400 flex-shrink-0">–</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
          className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 flex-1 min-w-0"
        />
      </div>

      {/* Lajittelu + laskuri */}
      <div className="flex items-center gap-2">
        <select
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOption })}
          className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 flex-1"
        >
          <option value="date_asc">Päivämäärä ↑</option>
          <option value="date_desc">Päivämäärä ↓</option>
          <option value="name_asc">Nimi A–Z</option>
        </select>
        {filtered < total && (
          <span className="text-xs text-gray-400 flex-shrink-0">{filtered}/{total}</span>
        )}
      </div>
    </div>
  );
}
