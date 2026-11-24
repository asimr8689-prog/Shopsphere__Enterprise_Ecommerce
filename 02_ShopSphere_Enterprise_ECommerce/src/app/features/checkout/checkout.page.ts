import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { startWith } from 'rxjs';
import { Address, COUNTRIES, DELIVERY_OPTIONS, DeliveryOption, PaymentMethod } from '@core/models';
import { uid, errorMessage } from '@core/services/api';
import { CartService } from '@core/services/cart.service';
import { NotificationService } from '@core/services/notification.service';
import { OrderService } from '@core/services/order.service';
import { UserService } from '@core/services/user.service';
import { CustomValidators, validationMessage } from '@core/validators/custom-validators';
import { OrderSummaryComponent } from '@shared/components/order-summary/order-summary.component';
import { InputMaskDirective } from '@shared/directives/input-mask.directive';

@Component({
  selector: 'app-checkout-page',
  imports: [
    RouterLink,
    CurrencyPipe,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    OrderSummaryComponent,
    InputMaskDirective,
  ],
  templateUrl: './checkout.page.html',
  styleUrl: './checkout.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);
  private readonly orders = inject(OrderService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly cart = inject(CartService);
  readonly users = inject(UserService);

  readonly countries = COUNTRIES;
  readonly deliveryOptions = DELIVERY_OPTIONS;
  readonly msg = validationMessage;
  readonly placing = signal(false);
  readonly placeError = signal<string | null>(null);
  readonly savedAddresses = computed(() => this.users.user()?.addresses ?? []);

  // ---------- Step forms ----------
  readonly contactForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(40), CustomValidators.notBlank]],
    lastName: ['', [Validators.required, Validators.maxLength(40), CustomValidators.notBlank]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, CustomValidators.phone]],
  });

  readonly shippingForm = this.fb.group({
    addressId: ['new'],
    address: this.fb.group({
      fullName: ['', [Validators.required, CustomValidators.notBlank]],
      line1: ['', [Validators.required, Validators.minLength(5)]],
      line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', [Validators.required, CustomValidators.postalCode]],
      country: ['United States', Validators.required],
      phone: ['', [Validators.required, CustomValidators.phone]],
    }),
    saveAddress: [false],
    deliveryOptionId: [this.cart.deliveryOption().id as DeliveryOption['id'], Validators.required],
  });

  readonly paymentForm = this.fb.group({
    method: ['card' as PaymentMethod, Validators.required],
    card: this.fb.group({
      nameOnCard: ['', [Validators.required, CustomValidators.notBlank]],
      number: ['', [Validators.required, CustomValidators.cardNumber]],
      expiry: ['', [Validators.required, CustomValidators.cardExpiry]],
      cvc: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    }),
  });

  readonly reviewForm = this.fb.group({
    acceptTerms: [false, Validators.requiredTrue],
  });

  readonly paymentMethod = toSignal(this.paymentForm.controls.method.valueChanges, { initialValue: 'card' as PaymentMethod });
  readonly addressChoice = toSignal(this.shippingForm.controls.addressId.valueChanges, { initialValue: 'new' });

  readonly selectedAddress = computed<Address | null>(() => {
    const id = this.addressChoice();
    return id === 'new' ? null : (this.savedAddresses().find((a) => a.id === id) ?? null);
  });

  ngOnInit(): void {
    this.prefillFromAccount();

    // Card fields are only validated when paying by card.
    this.paymentForm.controls.method.valueChanges
      .pipe(startWith(this.paymentForm.controls.method.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((method) => (method === 'card' ? this.paymentForm.controls.card.enable() : this.paymentForm.controls.card.disable()));

    // Saved address selected → the new-address form is not required.
    this.shippingForm.controls.addressId.valueChanges
      .pipe(startWith(this.shippingForm.controls.addressId.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => (id === 'new' ? this.shippingForm.controls.address.enable() : this.shippingForm.controls.address.disable()));

    // Delivery choice immediately updates totals in the NgRx cart state.
    this.shippingForm.controls.deliveryOptionId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => this.cart.setDeliveryOption(id));
  }

  private prefillFromAccount(): void {
    const user = this.users.user();
    if (!user) return;
    this.contactForm.patchValue({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? '' });
    const def = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
    if (def) this.shippingForm.controls.addressId.setValue(def.id);
    this.shippingForm.controls.address.patchValue({ fullName: `${user.firstName} ${user.lastName}`, phone: user.phone ?? '' });
  }

  onStepChange(event: StepperSelectionEvent): void {
    // Copy contact details into the address form the first time the shipping step opens.
    if (event.selectedIndex === 1) {
      const addr = this.shippingForm.controls.address;
      const c = this.contactForm.getRawValue();
      if (!addr.controls.fullName.value) addr.controls.fullName.setValue(`${c.firstName} ${c.lastName}`.trim());
      if (!addr.controls.phone.value) addr.controls.phone.setValue(c.phone);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  shippingAddress(): Address {
    const saved = this.selectedAddress();
    if (saved) return saved;
    const a = this.shippingForm.controls.address.getRawValue();
    return { id: uid('a'), label: 'Shipping', ...a, line2: a.line2 || undefined, isDefault: false };
  }

  deliveryLabel(): string {
    return this.cart.deliveryOption().label;
  }

  cardLast4(): string | undefined {
    if (this.paymentMethod() !== 'card') return undefined;
    return this.paymentForm.controls.card.controls.number.value.replace(/\D/g, '').slice(-4);
  }

  placeOrder(): void {
    if (this.contactForm.invalid || this.shippingForm.invalid || this.paymentForm.invalid || this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      this.notify.error('Please complete all required fields before placing your order.');
      return;
    }
    this.placing.set(true);
    this.placeError.set(null);
    const address = this.shippingAddress();
    const coupon = this.cart.coupon();

    this.orders
      .placeOrder(
        {
          customer: this.contactForm.getRawValue(),
          shippingAddress: address,
          deliveryOptionId: this.cart.deliveryOption().id,
          paymentMethod: this.paymentMethod(),
          cardLast4: this.cardLast4(),
        },
        this.cart.items(),
        this.cart.totals(),
        this.users.user()?.id ?? null,
        coupon && !this.cart.couponWarning() ? coupon.code : null,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          if (this.users.isLoggedIn() && !this.selectedAddress() && this.shippingForm.controls.saveAddress.value) {
            this.users.saveAddress({ ...address, label: 'Saved at checkout' });
          }
          this.cart.clear();
          this.router.navigate(['/checkout/confirmation', order.id]);
        },
        error: (err) => {
          this.placing.set(false);
          this.placeError.set(errorMessage(err));
        },
      });
  }
}
