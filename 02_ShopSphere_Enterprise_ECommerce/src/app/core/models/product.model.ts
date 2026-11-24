export type ProductTag = 'featured' | 'trending' | 'bestseller' | 'new';

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  /** Current selling price. */
  price: number;
  /** Original price before discount; null/undefined when not on sale. */
  compareAtPrice?: number | null;
  rating: number;
  reviewCount: number;
  stock: number;
  /** Units sold – used for "popularity" sorting and best-sellers. */
  sold: number;
  images: string[];
  specs: ProductSpec[];
  tags: ProductTag[];
  reviews: ProductReview[];
  createdAt: string;
}

export type SortOption = 'relevance' | 'popularity' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export interface ProductQuery {
  search: string;
  categories: string[];
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  sort: SortOption;
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export const LOW_STOCK_THRESHOLD = 10;

export function stockStatus(stock: number): StockStatus {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= LOW_STOCK_THRESHOLD) return 'low-stock';
  return 'in-stock';
}

export function discountPercent(p: Pick<Product, 'price' | 'compareAtPrice'>): number {
  if (!p.compareAtPrice || p.compareAtPrice <= p.price) return 0;
  return Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100);
}
