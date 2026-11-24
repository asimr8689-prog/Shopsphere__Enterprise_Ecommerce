import { Category, LOW_STOCK_THRESHOLD, Order, OrderStatus, Product } from '@core/models';

export interface DashboardStats {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  productCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  customerCount: number;
  monthly: { label: string; revenue: number; orders: number }[];
  byStatus: { status: OrderStatus; count: number }[];
  byCategory: { name: string; revenue: number }[];
  recentOrders: Order[];
  lowStock: Product[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Aggregates mock orders/products into dashboard metrics (pure, unit-testable). */
export function buildDashboardStats(products: Product[], orders: Order[], categories: Category[]): DashboardStats {
  const paid = orders.filter((o) => o.status !== 'cancelled');
  const revenue = paid.reduce((s, o) => s + o.total, 0);

  // Last 12 months, anchored on the newest order so mock data always fills the chart.
  const latest = orders.length ? new Date(orders.reduce((m, o) => (o.createdAt > m ? o.createdAt : m), orders[0].createdAt)) : new Date();
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(latest.getFullYear(), latest.getMonth() - (11 - i), 1);
    const inMonth = paid.filter((o) => {
      const od = new Date(o.createdAt);
      return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
    });
    return {
      label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      revenue: Math.round(inMonth.reduce((s, o) => s + o.total, 0)),
      orders: inMonth.length,
    };
  });

  const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled'];
  const byStatus = statuses.map((status) => ({ status, count: orders.filter((o) => o.status === status).length }));

  const productCategory = new Map(products.map((p) => [p.id, p.categoryId]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const catRevenue = new Map<string, number>();
  for (const o of paid) {
    for (const item of o.items) {
      const cat = productCategory.get(item.productId) ?? 'other';
      catRevenue.set(cat, (catRevenue.get(cat) ?? 0) + item.price * item.quantity);
    }
  }
  const byCategory = [...catRevenue.entries()]
    .map(([id, rev]) => ({ name: categoryName.get(id) ?? 'Other', revenue: Math.round(rev) }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    revenue,
    orderCount: orders.length,
    avgOrderValue: paid.length ? revenue / paid.length : 0,
    productCount: products.length,
    lowStockCount: products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length,
    outOfStockCount: products.filter((p) => p.stock <= 0).length,
    customerCount: new Set(orders.map((o) => o.customer.email)).size,
    monthly,
    byStatus,
    byCategory,
    recentOrders: orders.slice(0, 6),
    lowStock: products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock).slice(0, 6),
  };
}
