import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const isEmpty = (v: unknown) => v === null || v === undefined || v === '';

/** Custom validators used by registration, checkout, account and admin forms. */
export class CustomValidators {
  /** ≥8 chars with upper, lower, digit and symbol. Returns which rules failed. */
  static strongPassword(control: AbstractControl): ValidationErrors | null {
    const value: string = control.value ?? '';
    if (!value) return null;
    const missing = {
      minLength: value.length < 8,
      uppercase: !/[A-Z]/.test(value),
      lowercase: !/[a-z]/.test(value),
      digit: !/\d/.test(value),
      symbol: !/[^A-Za-z0-9]/.test(value),
    };
    return Object.values(missing).some(Boolean) ? { strongPassword: missing } : null;
  }

  /** Group validator: two controls must match (e.g. password + confirm). Error is set on the group. */
  static matchFields(field: string, confirmField: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const a = group.get(field)?.value;
      const b = group.get(confirmField)?.value;
      return isEmpty(b) || a === b ? null : { fieldsMismatch: { field, confirmField } };
    };
  }

  /** International-friendly phone: digits, spaces, dashes, brackets, optional +, 7–15 digits. */
  static phone(control: AbstractControl): ValidationErrors | null {
    const v: string = control.value ?? '';
    if (!v) return null;
    const digits = v.replace(/\D/g, '');
    return /^\+?[\d\s\-()]+$/.test(v) && digits.length >= 7 && digits.length <= 15 ? null : { phone: true };
  }

  /** 3–10 alphanumeric chars (covers US ZIP, UK/CA postcodes, PK 5-digit codes…). */
  static postalCode(control: AbstractControl): ValidationErrors | null {
    const v: string = (control.value ?? '').trim();
    if (!v) return null;
    return /^[A-Za-z0-9][A-Za-z0-9\- ]{1,8}[A-Za-z0-9]$/.test(v) ? null : { postalCode: true };
  }

  /** Luhn checksum for card numbers (demo payment form only – nothing is charged). */
  static cardNumber(control: AbstractControl): ValidationErrors | null {
    const digits = String(control.value ?? '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length < 13 || digits.length > 19) return { cardNumber: true };
    let sum = 0;
    let double = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = Number(digits[i]);
      if (double) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      double = !double;
    }
    return sum % 10 === 0 ? null : { cardNumber: true };
  }

  /** MM/YY that is not in the past. */
  static cardExpiry(control: AbstractControl): ValidationErrors | null {
    const v: string = control.value ?? '';
    if (!v) return null;
    const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v.trim());
    if (!match) return { cardExpiry: 'format' };
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const now = new Date();
    const expired = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
    return expired ? { cardExpiry: 'expired' } : null;
  }

  /** Rejects values that are only whitespace. */
  static notBlank(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    return typeof v === 'string' && v.length > 0 && v.trim().length === 0 ? { notBlank: true } : null;
  }

  /** Group validator: compare-at price must be greater than the selling price when provided. */
  static compareAtAbovePrice(priceField = 'price', compareField = 'compareAtPrice'): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const price = Number(group.get(priceField)?.value);
      const raw = group.get(compareField)?.value;
      if (isEmpty(raw)) return null;
      return Number(raw) > price ? null : { compareAtNotAbovePrice: true };
    };
  }
}

/** Maps validation errors to human-readable messages for <mat-error>. */
export function validationMessage(control: AbstractControl | null, label = 'This field'): string {
  const e = control?.errors;
  if (!e) return '';
  if (e['required']) return `${label} is required`;
  if (e['email']) return 'Enter a valid email address';
  if (e['minlength']) return `${label} must be at least ${e['minlength'].requiredLength} characters`;
  if (e['maxlength']) return `${label} must be at most ${e['maxlength'].requiredLength} characters`;
  if (e['min']) return `${label} must be at least ${e['min'].min}`;
  if (e['max']) return `${label} must be at most ${e['max'].max}`;
  if (e['pattern']) return `${label} has an invalid format`;
  if (e['phone']) return 'Enter a valid phone number';
  if (e['postalCode']) return 'Enter a valid postal code';
  if (e['cardNumber']) return 'Card number is not valid';
  if (e['cardExpiry']) return e['cardExpiry'] === 'expired' ? 'This card has expired' : 'Use the format MM/YY';
  if (e['notBlank']) return `${label} cannot be blank`;
  if (e['strongPassword']) return 'Use 8+ characters with upper & lower case, a number and a symbol';
  return `${label} is invalid`;
}
