import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

/**
 * Lazy Image Directive
 *
 * Loads images only when they enter the viewport using IntersectionObserver.
 * Provides fallback image on error.
 *
 * @example
 * <img
 *   [appLazyImage]="imageUrl"
 *   [fallback]="'/assets/images/default-avatar.png'"
 *   alt="User avatar"
 * />
 */
@Directive({
  selector: 'img[appLazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit, OnDestroy {
  /**
   * The actual image URL to load
   */
  @Input() appLazyImage!: string;

  /**
   * Fallback image to show if loading fails
   */
  @Input() fallback: string = '/assets/images/default-avatar.svg';

  /**
   * Placeholder image to show while loading
   */
  @Input() placeholder: string = '';

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit() {
    const img = this.el.nativeElement;

    // Set placeholder or fallback while loading
    if (this.placeholder) {
      img.src = this.placeholder;
    } else if (this.fallback) {
      img.src = this.fallback;
    }

    // Add loading class for CSS styling
    img.classList.add('lazy-loading');

    // Setup IntersectionObserver for lazy loading
    this.setupLazyLoading();

    // Setup error handling
    this.setupErrorHandling();
  }

  ngOnDestroy() {
    // Cleanup observer
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * Setup IntersectionObserver to load image when visible
   */
  private setupLazyLoading(): void {
    const img = this.el.nativeElement;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback for older browsers - load immediately
      this.loadImage();
      return;
    }

    // Create observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage();
            // Stop observing after loading
            if (this.observer) {
              this.observer.disconnect();
            }
          }
        });
      },
      {
        // Load when 10% of image is visible
        threshold: 0.1,
        // Start loading a bit before image enters viewport
        rootMargin: '50px'
      }
    );

    // Start observing
    this.observer.observe(img);
  }

  /**
   * Load the actual image
   */
  private loadImage(): void {
    const img = this.el.nativeElement;

    // Create temporary image to preload
    const tempImg = new Image();

    tempImg.onload = () => {
      // Set actual source
      img.src = this.appLazyImage;
      // Remove loading class, add loaded class
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
    };

    tempImg.onerror = () => {
      // Load failed, use fallback
      img.src = this.fallback;
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
    };

    // Start loading
    tempImg.src = this.appLazyImage;
  }

  /**
   * Setup error handling for image load failures
   */
  private setupErrorHandling(): void {
    const img = this.el.nativeElement;

    img.onerror = () => {
      // Only set fallback if current src is not already the fallback
      if (img.src !== this.fallback) {
        img.src = this.fallback;
        img.classList.add('lazy-error');
        console.warn(`Failed to load image: ${this.appLazyImage}`);
      }
    };
  }
}
