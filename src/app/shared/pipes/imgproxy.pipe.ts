import { Pipe, PipeTransform } from '@angular/core';
import { ImgproxyService, ImgproxyOptions } from '../../core/services/imgproxy.service';

/**
 * ImgProxy Pipe
 *
 * Transforms S3 key to signed imgproxy URL.
 * Returns fallback image if key is null/undefined.
 *
 * @example
 * <!-- Basic usage -->
 * <img [src]="student.photoKey | imgproxy" />
 *
 * <!-- With options -->
 * <img [src]="student.photoKey | imgproxy: { width: 256, height: 256, fit: 'cover', format: 'webp' }" />
 *
 * <!-- With preset -->
 * <img [src]="student.photoKey | imgproxy: 'avatar'" />
 */
@Pipe({
  name: 'imgproxy',
  standalone: true
})
export class ImgproxyPipe implements PipeTransform {
  private readonly fallbackImage = '/assets/images/default-avatar.svg';

  constructor(private imgproxy: ImgproxyService) {}

  /**
   * Transform S3 key to imgproxy URL
   *
   * @param s3Key S3 object key (e.g., 'users/123/photos/avatar.jpg')
   * @param options Processing options or preset name
   * @returns Signed imgproxy URL or fallback image
   */
  transform(
    s3Key: string | null | undefined,
    options?: ImgproxyOptions | keyof typeof this.imgproxy.presets
  ): string {
    // Return fallback if no key
    if (!s3Key) {
      return this.fallbackImage;
    }

    // If imgproxy is not configured, return fallback
    if (!this.imgproxy.isConfigured()) {
      console.warn('Imgproxy is not configured. Using fallback image.');
      return this.fallbackImage;
    }

    // If options is a preset name (string)
    if (typeof options === 'string') {
      return this.imgproxy.presetUrl(s3Key, options as keyof typeof this.imgproxy.presets);
    }

    // Otherwise use options object
    return this.imgproxy.signedUrl(s3Key, options || {});
  }
}
