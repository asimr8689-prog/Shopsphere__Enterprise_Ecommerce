export * from './product.model';
export * from './category.model';
export * from './cart.model';
export * from './user.model';
export * from './order.model';

export interface Testimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
}

/** Generic async-resource state used by signal-based services. */
export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';
