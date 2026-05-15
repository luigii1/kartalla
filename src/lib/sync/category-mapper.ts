import type { EventCategory } from '@/lib/types';

const YSO_MAP: Record<string, EventCategory> = {
  'yso:p1808': 'music',
  'yso:p1972': 'music',
  'yso:p18804': 'music',
  'yso:p3488': 'music',
  'yso:p7504': 'music',
  'yso:p965': 'sports',
  'yso:p916': 'sports',
  'yso:p8018': 'sports',
  'yso:p3670': 'food',
  'yso:p31524': 'food',
  'yso:p360': 'culture',
  'yso:p6165': 'culture',
  'yso:p4363': 'culture',
  'yso:p8113': 'culture',
  'yso:p2625': 'culture',
  'yso:p14004': 'culture',
};

export function mapKeywordsToCategory(keywords: Array<{ '@id': string }>): EventCategory {
  for (const kw of keywords) {
    const match = kw['@id'].match(/(yso:p\d+)/);
    if (match && YSO_MAP[match[1]]) return YSO_MAP[match[1]];
  }
  return 'other';
}
