import { PagedResult, Product, ProductQuery, SortOption, discountPercent } from '../models';

export const DEFAULT_PAGE_SIZE = 12;

export const DEFAULT_QUERY: ProductQuery = {
  search: '',
  categories: [],
  brands: [],
  minPrice: null,
  maxPrice: null,
  minRating: null,
  inStockOnly: false,
  onSaleOnly: false,
  sort: 'relevance',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

/** Relevance score for a free-text search. 0 means "no match". */
export function searchScore(product: Product, term: string): number {
  const t = term.trim().toLowerCase();
  if (!t) return 1;
  const words = t.split(/\s+/);
  const name = product.name.toLowerCase();
  const haystack = `${name} ${product.brand} ${product.categoryId} ${product.shortDescription} ${product.tags.join(' ')}`.toLowerCase();
  let score = 0;
  for (const w of words) {
    if (!haystack.includes(w)) return 0; // every word must match somewhere
    score += name.includes(w) ? 3 : 1;
    if (name.startsWith(w)) score += 2;
  }
  if (name.includes(t)) score += 5;
  return score;
}

function sortProducts(list: Product[], sort: SortOption, term: string): Product[] {
  const sorted = [...list];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'popularity':
      return sorted.sort((a, b) => b.sold - a.sold);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case 'newest':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'relevance':
    default:
      return term.trim()
        ? sorted.sort((a, b) => searchScore(b, term) - searchScore(a, term))
        : sorted.sort((a, b) => b.sold * b.rating - a.sold * a.rating);
  }
}

/** Pure filtering/sorting/pagination – shared by the catalog page and unit tests. */
export function applyProductQuery(products: Product[], query: ProductQuery): PagedResult<Product> {
  const q = { ...DEFAULT_QUERY, ...query };
  const filtered = products.filter((p) => {
    if (q.search && searchScore(p, q.search) === 0) return false;
    if (q.categories.length && !q.categories.includes(p.categoryId)) return false;
    if (q.brands.length && !q.brands.includes(p.brand)) return false;
    if (q.minPrice != null && p.price < q.minPrice) return false;
    if (q.maxPrice != null && p.price > q.maxPrice) return false;
    if (q.minRating != null && p.rating < q.minRating) return false;
    if (q.inStockOnly && p.stock <= 0) return false;
    if (q.onSaleOnly && discountPercent(p) === 0) return false;
    return true;
  });
  const sorted = sortProducts(filtered, q.sort, q.search);
  const pageSize = Math.max(1, q.pageSize);
  const lastPage = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(1, q.page), lastPage);
  const start = (page - 1) * pageSize;
  return { items: sorted.slice(start, start + pageSize), total: sorted.length, page, pageSize };
}
