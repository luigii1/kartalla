'use client';

import { EventCategory, CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/types';

export interface Filters {
  categories: Set<EventCategory>;
  dateFrom: string;
  dateTo: string;
}

export const ALL_CATEGORIES: EventCategory[] = ['music', 'sports', 'food', 'culture', 'other'];

export function defaultFilters(): Filters {
  return {
    categories: new Set(ALL_CATEGORIES),
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: '',
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
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {ALL_CATEGORIES.map((cat) => {
          const active = filters.categories.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                active ? 'text-white border-transparent' : 'bg-white text-gray-400 border-gray-200'
              }`}
              style={active ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-700"
        />
        <span className="text-xs text-gray-400">–</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
          className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-700"
        />
      </div>

      {filtered < total && (
        <span className="text-xs text-gray-400 ml-auto">
          {filtered} / {total} tapahtumaa
        </span>
      )}
    </div>
  );
}
