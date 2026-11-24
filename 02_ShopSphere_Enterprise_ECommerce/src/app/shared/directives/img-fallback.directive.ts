import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

/**
 * <img [src]="url" appImgFallback /> – swaps to a placeholder if the image fails to load
 * (e.g. a broken URL from a remote API). Only falls back once to avoid error loops.
 */
@Directive({
  selector: 'img[appImgFallback]',
  host: { loading: 'lazy', decoding: 'async' },
})
export class ImgFallbackDirective {
  readonly appImgFallback = input<string>('');
  private readonly el = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private failed = false;

  @HostListener('error')
  onError(): void {
    if (this.failed) return;
    this.failed = true;
    this.el.nativeElement.src = this.appImgFallback() || 'images/placeholder.svg';
    this.el.nativeElement.classList.add('img-fallback');
  }
}
