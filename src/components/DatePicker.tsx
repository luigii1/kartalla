'use client';

import { useState, useRef, useEffect } from 'react';

const FI_MONTHS = [
  'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu',
  'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu',
  'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu',
];
const FI_DAYS = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];

interface DatePickerProps {
  value: string; // ISO YYYY-MM-DD
  onChange: (value: string) => void;
  align?: 'left' | 'right';
  className?: string;
}

export default function DatePicker({ value, onChange, align = 'left', className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const parsed = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear, setViewYear] = useState(() => parsed?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsed?.getMonth() ?? new Date().getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const display = parsed
    ? `${String(parsed.getDate()).padStart(2, '0')}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${parsed.getFullYear()}`
    : '';

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Monday-first: Mon=0 … Sun=6
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(firstDow).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayIso = new Date().toISOString().slice(0, 10);

  function toIso(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      {/* Rendered as a <button> rather than an <input> so mobile Safari never
          auto-zooms into it on tap (which happens for small-font inputs). */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full cursor-pointer select-none text-left ${display ? '' : 'text-gray-400'} ${className ?? ''}`}
      >
        {display || 'pp.kk.vvvv'}
      </button>
      {open && (
        <div className={`absolute z-50 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-[196px] ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 text-base leading-none">‹</button>
            <span className="text-xs font-medium text-gray-700">{FI_MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 text-base leading-none">›</button>
          </div>
          <div className="grid grid-cols-7">
            {FI_DAYS.map(d => (
              <div key={d} className="text-center text-[9px] text-gray-400 font-medium py-0.5">{d}</div>
            ))}
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const iso = toIso(day);
              const isSel = iso === value;
              const isToday = iso === todayIso;
              return (
                <button
                  key={i}
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className={`text-xs py-0.5 rounded text-center ${
                    isSel
                      ? 'bg-blue-600 text-white font-medium'
                      : isToday
                      ? 'text-blue-600 font-semibold hover:bg-gray-100'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
