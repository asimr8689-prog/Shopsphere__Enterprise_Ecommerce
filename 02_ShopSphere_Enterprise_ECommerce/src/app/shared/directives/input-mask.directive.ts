import { Directive, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

export type MaskKind = 'card' | 'expiry' | 'digits';

/**
 * Lightweight input masking that works with Reactive Forms:
 *  - card:   "4242424242424242" → "4242 4242 4242 4242"
 *  - expiry: "1228" → "12/28"
 *  - digits: strips everything that is not a digit
 */
@Directive({
  selector: 'input[appInputMask]',
  host: { '(input)': 'onInput($event)' },
})
export class InputMaskDirective {
  readonly appInputMask = input.required<MaskKind>();
  private readonly control = inject(NgControl, { optional: true, self: true });

  onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const formatted = formatMask(el.value, this.appInputMask());
    if (formatted !== el.value) {
      el.value = formatted;
      this.control?.control?.setValue(formatted, { emitEvent: true });
    }
  }
}

export function formatMask(value: string, kind: MaskKind): string {
  const digits = value.replace(/\D/g, '');
  switch (kind) {
    case 'card':
      return digits.slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
    case 'expiry':
      return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}` : digits;
    default:
      return digits;
  }
}
