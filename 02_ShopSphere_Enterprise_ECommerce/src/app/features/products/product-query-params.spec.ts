import { convertToParamMap } from '@angular/router';
import { DEFAULT_QUERY } from '@core/services/product-query';
import { parseProductQuery, toQueryParams } from './product-query-params';

describe('product query params', () => {
  it('parses URL params into a typed query', () => {
    const q = parseProductQuery(convertToParamMap({ q: 'lamp', category: 'home,audio', min: '10', sale: '1', sort: 'price-asc', page: '2' }));
    expect(q.search).toBe('lamp');
    expect(q.categories).toEqual(['home', 'audio']);
    expect(q.minPrice).toBe(10);
    expect(q.onSaleOnly).toBeTrue();
    expect(q.sort).toBe('price-asc');
    expect(q.page).toBe(2);
  });

  it('falls back to defaults for invalid values', () => {
    const q = parseProductQuery(convertToParamMap({ sort: 'hacked', size: '7', page: '-4', min: 'abc' }));
    expect(q.sort).toBe('relevance');
    expect(q.pageSize).toBe(DEFAULT_QUERY.pageSize);
    expect(q.page).toBe(1);
    expect(q.minPrice).toBeNull();
  });

  it('round-trips and omits defaults', () => {
    expect(toQueryParams(DEFAULT_QUERY)).toEqual({});
    const params = toQueryParams({ ...DEFAULT_QUERY, brands: ['Terra'], inStockOnly: true });
    expect(parseProductQuery(convertToParamMap(params)).brands).toEqual(['Terra']);
  });
});
