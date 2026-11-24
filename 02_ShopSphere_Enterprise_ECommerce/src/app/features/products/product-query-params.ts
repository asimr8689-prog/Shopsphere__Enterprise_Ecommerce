import { ParamMap, Params } from '@angular/router';
import { ProductQuery, SortOption } from '@core/models';
import { DEFAULT_QUERY } from '@core/services/product-query';

const SORTS: SortOption[] = ['relevance', 'popularity', 'price-asc', 'price-desc', 'rating', 'newest'];
const PAGE_SIZES = [12, 24, 48];

const num = (v: string | null): number | null => {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const list = (v: string | null): string[] => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

/** URL → query. The URL is the single source of truth so filters survive refresh and are shareable. */
export function parseProductQuery(params: ParamMap): ProductQuery {
  const sort = params.get('sort') as SortOption | null;
  const size = num(params.get('size'));
  return {
    ...DEFAULT_QUERY,
    search: params.get('q') ?? '',
    categories: list(params.get('category')),
    brands: list(params.get('brand')),
    minPrice: num(params.get('min')),
    maxPrice: num(params.get('max')),
    minRating: num(params.get('rating')),
    inStockOnly: params.get('stock') === '1',
    onSaleOnly: params.get('sale') === '1',
    sort: sort && SORTS.includes(sort) ? sort : 'relevance',
    page: Math.max(1, num(params.get('page')) ?? 1),
    pageSize: size && PAGE_SIZES.includes(size) ? size : DEFAULT_QUERY.pageSize,
  };
}

/** Query → URL params, omitting defaults to keep URLs short. */
export function toQueryParams(q: ProductQuery): Params {
  const p: Params = {};
  if (q.search) p['q'] = q.search;
  if (q.categories.length) p['category'] = q.categories.join(',');
  if (q.brands.length) p['brand'] = q.brands.join(',');
  if (q.minPrice != null) p['min'] = q.minPrice;
  if (q.maxPrice != null) p['max'] = q.maxPrice;
  if (q.minRating != null) p['rating'] = q.minRating;
  if (q.inStockOnly) p['stock'] = 1;
  if (q.onSaleOnly) p['sale'] = 1;
  if (q.sort !== 'relevance') p['sort'] = q.sort;
  if (q.page > 1) p['page'] = q.page;
  if (q.pageSize !== DEFAULT_QUERY.pageSize) p['size'] = q.pageSize;
  return p;
}

export const PAGE_SIZE_OPTIONS = PAGE_SIZES;
