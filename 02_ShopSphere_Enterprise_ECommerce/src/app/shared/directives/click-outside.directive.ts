import { Directive, ElementRef, inject, output } from '@angular/core';

/** Emits when a pointer press happens outside the host element (used to close search suggestions). */
@Directive({
  selector: '[appClickOutside]',
  host: { '(document:pointerdown)': 'onDocumentPointerDown($event)' },
})
export class ClickOutsideDirective {
  readonly appClickOutside = output<void>();
  private readonly el = inject(ElementRef<HTMLElement>);

  onDocumentPointerDown(event: Event): void {
    const target = event.target as Node | null;
    if (target && !this.el.nativeElement.contains(target)) {
      this.appClickOutside.emit();
    }
  }
}
