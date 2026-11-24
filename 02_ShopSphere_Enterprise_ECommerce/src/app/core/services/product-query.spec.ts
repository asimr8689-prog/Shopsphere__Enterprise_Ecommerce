import { Product } from '../models';
import { DEFAULT_QUERY, applyProductQuery } from './product-query';

const make = (id: number, o: Partial<Product>): Product => ({
  id: `p-${id}`,
  slug: `p-${id}`,
  name: `Product ${id}`,
  brand: 'Aurora',
  categoryId: 'audio',
  shortDescription: '',
  description: '',
  price: 100,
  compareAtPrice: null,
  rating: 4,
  reviewCount: 10,
  stock: 10,
  sold: 10,
  images: [],
  specs: [],
  tags: [],
  reviews: [],
  createdAt: '2026-01-01',
  ...o,
});

const catalogue: Product[] = [
  make(1, { name: 'Studio Headphones', price: 199, sold: 500, rating: 4.8 }),
  make(2, { name: 'Trail Shoe', categoryId: 'footwear', brand: 'Terra', price: 120, sold: 50, stock: 0 }),
  make(3, { name: 'Desk Lamp', categoryId: 'home', brand: 'Lumen', price: 60, compareAtPrice: 80, sold: 900, rating: 3.9 }),
  make(4, { name: 'Wireless Earbuds', price: 89, sold: 300, rating: 4.5 }),
];

describe('applyProductQuery', () => {
  it('filters by category and brand', () => {
    expect(applyProductQuery(catalogue, { ...DEFAULT_QUERY, categories: ['audio'] }).total).toBe(2);
    expect(applyProductQuery(catalogue, { ...DEFAULT_QUERY, brands: ['Terra'] }).items[0].id).toBe('p-2');
  });

  it('filters by price range, rating, stock and sale', () => {
    expect(applyProductQuery(catalogue, { ...DEFAULT_QUERY, minPrice: 80, maxPrice: 150 }).total).toBe(2);
    expect(applyProductQuery(catalogue, { ...DEFAULT_QUERY, minRating: 4.5 }).total).toBe(2);
    expect(applyProductQuery(catalogue, { ...DEFAULT_QUERY, inStockOnly: true }).total).toBe(3);
    expect(applyProductQuery(catalogue, { ...DEFAULT_QUERY, onSaleOnly: true }).items.map((p) => p.id)).toEqual(['p-3']);
  });

  it('searches names with every word required', () => {
    expect(applyProductQuery(catalogue, { ...DEFAULT_QUERY, search: 'headphones' }).items[0].id).toBe('p-1');
    expect(applyProductQuery(catalogue, { ...DEFAULT_QUERY, search: 'studio lamp' }).total).toBe(0);
  });

  it('sorts by price and popularity', () => {
    const asc = applyProductQuery(catalogue, { ...DEFAULT_QUERY, sort: 'price-asc' }).items.map((p) => p.price);
    expect(asc).toEqual([60, 89, 120, 199]);
    expect(applyProductQuery(catalogue, { ...DEFAULT_QUERY, sort: 'popularity' }).items[0].id).toBe('p-3');
  });

  it('paginates and clamps out-of-range pages', () => {
    const r = applyProductQuery(catalogue, { ...DEFAULT_QUERY, pageSize: 3, page: 9 });
    expect(r.page).toBe(2);
    expect(r.items.length).toBe(1);
    expect(r.total).toBe(4);
  });
});
