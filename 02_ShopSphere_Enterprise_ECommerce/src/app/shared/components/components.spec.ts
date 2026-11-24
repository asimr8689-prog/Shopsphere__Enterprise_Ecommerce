import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZoneChangeDetection } from '@angular/core';
import { PriceTagComponent } from './price-tag/price-tag.component';
import { QuantitySelectorComponent } from './quantity-selector/quantity-selector.component';
import { RatingStarsComponent } from './rating-stars/rating-stars.component';
import { DiscountPipe } from '../pipes/discount.pipe';
import { TruncatePipe } from '../pipes/truncate.pipe';

describe('Shared UI', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZoneChangeDetection()] }));

  describe('QuantitySelectorComponent', () => {
    let fixture: ComponentFixture<QuantitySelectorComponent>;
    beforeEach(() => {
      fixture = TestBed.createComponent(QuantitySelectorComponent);
      fixture.componentRef.setInput('max', 3);
      fixture.detectChanges();
    });

    it('clamps values between min and max', () => {
      const cmp = fixture.componentInstance;
      cmp.set(10);
      expect(cmp.value()).toBe(3);
      cmp.set(-2);
      expect(cmp.value()).toBe(1);
    });

    it('disables the increment button at max', () => {
      fixture.componentInstance.set(3);
      fixture.detectChanges();
      const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
      expect(buttons[1].disabled).toBeTrue();
    });
  });

  it('PriceTagComponent shows a discount badge when on sale', () => {
    const fixture = TestBed.createComponent(PriceTagComponent);
    fixture.componentRef.setInput('price', 75);
    fixture.componentRef.setInput('compareAtPrice', 100);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('-25%');
  });

  it('RatingStarsComponent renders 5 stars with halves', () => {
    const fixture = TestBed.createComponent(RatingStarsComponent);
    fixture.componentRef.setInput('rating', 3.5);
    fixture.detectChanges();
    expect(fixture.componentInstance.stars()).toEqual(['full', 'full', 'full', 'half', 'empty']);
  });

  it('pipes format values', () => {
    expect(new DiscountPipe().transform({ price: 60, compareAtPrice: 80 })).toBe(25);
    expect(new TruncatePipe().transform('The quick brown fox jumps over the lazy dog', 20)).toBe('The quick brown fox…');
  });
});
