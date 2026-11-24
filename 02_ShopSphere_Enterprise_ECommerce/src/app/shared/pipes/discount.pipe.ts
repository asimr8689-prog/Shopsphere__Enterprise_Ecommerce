import { Pipe, PipeTransform } from '@angular/core';
import { Product, discountPercent } from '@core/models';

/** {{ product | discount }} → 25 (percent off), 0 when not on sale. */
@Pipe({ name: 'discount' })
export class DiscountPipe implements PipeTransform {
  transform(product: Pick<Product, 'price' | 'compareAtPrice'> | null | undefined): number {
    return product ? discountPercent(product) : 0;
  }
}
