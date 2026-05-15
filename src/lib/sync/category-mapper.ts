import type { EventCategory } from '@/lib/types';

// YSO-ontologia → kategoria
// Koko lista: https://finto.fi/yso/fi/
const YSO_MAP: Record<string, EventCategory> = {
  'yso:p1808': 'music',    // musiikki
  'yso:p1972': 'music',    // rock-musiikki
  'yso:p18804': 'music',   // pop-musiikki
  'yso:p3488': 'music',    // jazz
  'yso:p7504': 'music',    // klassinen musiikki
  'yso:p965': 'sports',    // urheilu
  'yso:p916': 'sports',    // liikunta
  'yso:p8018': 'sports',   // kilpaurheilu
  'yso:p3670': 'food',     // ruoka
  'yso:p31524': 'food',    // ravintolat
  'yso:p360': 'culture',   // kulttuuri
  'yso:p6165': 'culture',  // teatteri
  'yso:p4363': 'culture',  // kuvataide
  'yso:p8113': 'culture',  // elokuvat
  'yso:p2625': 'culture',  // festivaalit
  'yso:p14004': 'culture', // näyttelyt
};

export function mapKeywordsToCategory(keywords: Array<{ '@id': string }>): EventCategory {
  for (const kw of keywords) {
    const match = kw['@id'].match(/(yso:p\d+)/);
    if (match && YSO_MAP[match[1]]) return YSO_MAP[match[1]];
  }
  return 'other';
}
