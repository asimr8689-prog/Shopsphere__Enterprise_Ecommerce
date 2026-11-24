import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { catchError, combineLatest, of } from 'rxjs';
import { CategoryService } from '@core/services/category.service';
import { ContentService } from '@core/services/content.service';
import { NotificationService } from '@core/services/notification.service';
import { ProductService } from '@core/services/product.service';
import { loadableSignal } from '@core/utils/loadable';
import { ProductCardComponent } from '@shared/components/product-card/product-card.component';
import { RatingStarsComponent } from '@shared/components/rating-stars/rating-stars.component';
import { SectionHeaderComponent } from '@shared/components/section-header/section-header.component';
import { ErrorStateComponent, ProductCardSkeletonComponent } from '@shared/components/state/state.components';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';
import { DiscountPipe } from '@shared/pipes/discount.pipe';

interface HeroSlide {
  eyebrow: string;
  title: string;
  text: string;
  cta: { label: string; link: string; params?: Record<string, string> };
  image: string;
  productImage: string;
}

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    ProductCardComponent,
    ProductCardSkeletonComponent,
    ErrorStateComponent,
    RatingStarsComponent,
    SectionHeaderComponent,
    ImgFallbackDirective,
    DiscountPipe,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly products = inject(ProductService);
  private readonly content = inject(ContentService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly slides: HeroSlide[] = [
    {
      eyebrow: 'New season audio',
      title: 'Hear every detail. Feel every beat.',
      text: 'Studio-grade headphones and earbuds with adaptive noise cancelling – now up to 30% off.',
      cta: { label: 'Shop audio', link: '/products', params: { category: 'audio' } },
      image: 'images/banners/hero-1.svg',
      productImage: 'images/products/aurora-studio-pro-headphones-1.svg',
    },
    {
      eyebrow: 'Built to move',
      title: 'Run further in the Cloudrunner.',
      text: 'Nitrogen-infused foam, recycled knit uppers and a fit that disappears on long runs.',
      cta: { label: 'Shop footwear', link: '/products', params: { category: 'footwear' } },
      image: 'images/banners/hero-2.svg',
      productImage: 'images/products/terra-cloudrunner-1.svg',
    },
    {
      eyebrow: 'Work from anywhere',
      title: 'Laptops that keep up with you.',
      text: 'OLED displays, all-day batteries and pro-grade performance in ultra-light designs.',
      cta: { label: 'Shop laptops', link: '/products', params: { category: 'computing' } },
      image: 'images/banners/hero-3.svg',
      productImage: 'images/products/vantage-air-14-laptop-1.svg',
    },
  ];
  readonly activeSlide = signal(0);
  readonly currentSlide = computed(() => this.slides[this.activeSlide()]);

  readonly categories = toSignal(inject(CategoryService).categories$.pipe(catchError(() => of([]))), {
    initialValue: [],
  });
  readonly testimonials = toSignal(this.content.testimonials$, { initialValue: [] });

  /** All product sections load together so a single error/retry state covers them. */
  readonly sections = loadableSignal(() =>
    combineLatest({
      featured: this.products.getByTag('featured', 8),
      trending: this.products.getByTag('trending', 4),
      bestSellers: this.products.getBestSellers(8),
      offers: this.products.getSpecialOffers(3),
    }),
  );

  readonly brands = ['Aurora', 'Nordvik', 'Pulse Labs', 'Kestrel', 'Lumen & Co', 'Vantage', 'Solace', 'Terra'];

  readonly faqs = [
    { q: 'How long does delivery take?', a: 'Standard delivery takes 3–5 business days and is free over $99. Express (1–2 days) and next-day options are available at checkout.' },
    { q: 'What is your returns policy?', a: 'You can return any unused item within 30 days for a full refund. Start a return from your order details page.' },
    { q: 'Is this a real store?', a: 'No – ShopSphere is a frontend portfolio project. Checkout uses a simulated payment flow and no money is ever charged.' },
    { q: 'Which coupon codes can I try?', a: 'Try SAVE10 (10% off), WELCOME20 (20% off orders over $150), FLAT25 ($25 off over $200) or FREESHIP.' },
  ];

  readonly newsletterEmail = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  readonly subscribing = signal(false);
  readonly subscribed = signal(false);

  ngOnInit(): void {
    const timer = setInterval(() => this.next(), 7000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  next(): void {
    this.activeSlide.update((i) => (i + 1) % this.slides.length);
  }

  prev(): void {
    this.activeSlide.update((i) => (i - 1 + this.slides.length) % this.slides.length);
  }

  goTo(index: number): void {
    this.activeSlide.set(index);
  }

  subscribe(): void {
    if (this.newsletterEmail.invalid) {
      this.newsletterEmail.markAsTouched();
      return;
    }
    this.subscribing.set(true);
    this.content.subscribe(this.newsletterEmail.value).subscribe({
      next: ({ email }) => {
        this.subscribing.set(false);
        this.subscribed.set(true);
        this.notify.success(`Thanks! ${email} is subscribed (demo – no emails are sent).`);
        this.newsletterEmail.reset();
      },
      error: () => {
        this.subscribing.set(false);
        this.notify.error('Subscription failed, please try again.');
      },
    });
  }
}
