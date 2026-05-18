'use client';

import type { EventCategory } from '@/lib/types';
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/types';
import DatePicker from './DatePicker';

export type SortOption = 'date_asc' | 'date_desc' | 'name_asc';

export interface Filters {
  categories: Set<EventCategory>;
  dateFrom: string;
  dateTo: string;
  sort: SortOption;
  search: string;
}

export function defaultFilters(): Filters {
  const today = new Date().toISOString().slice(0, 10);
  return {
    categories: new Set<EventCategory>(['music', 'sports', 'food', 'culture', 'family', 'other']),
    dateFrom: today,
    dateTo: today,
    sort: 'date_asc',
    search: '',
  };
}

const ALL_CATEGORIES: EventCategory[] = ['music', 'sports', 'food', 'culture', 'family', 'other'];

interface FilterBarProps {
  filters: Filters;
  eventCount: number;
  onChange: (filters: Filters) => void;
}

export default function FilterBar({ filters, eventCount, onChange }: FilterBarProps) {
  const toggleCategory = (cat: EventCategory) => {
    const next = new Set(filters.categories);
    if (next.has(cat)) { next.delete(cat); } else { next.add(cat); }
    onChange({ ...filters, categories: next });
  };

  return (
    <div className="flex flex-col gap-2 p-3 border-b border-gray-100 bg-white flex-shrink-0">
      <input
        type="text"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        placeholder="Hae tapahtumia..."
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex flex-wrap gap-1.5">
        {ALL_CATEGORIES.map((cat) => {
          const active = filters.categories.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all ${
                active ? 'text-white border-transparent' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
              style={active ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 items-center">
        <DatePicker
          value={filters.dateFrom}
          onChange={(v) => onChange({ ...filters, dateFrom: v })}
          align="left"
          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400 text-xs shrink-0">–</span>
        <DatePicker
          value={filters.dateTo}
          onChange={(v) => onChange({ ...filters, dateTo: v })}
          align="right"
          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center justify-between">
        <select
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOption })}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date_asc">Aikajärjestys ↑</option>
          <option value="date_desc">Aikajärjestys ↓</option>
          <option value="name_asc">Nimi A–Ö</option>
        </select>
        <span className="text-xs text-gray-400">{eventCount} tapahtumaa</span>
      </div>
    </div>
  );
}
