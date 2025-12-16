import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import * as CryptoJS from 'crypto-js';

/**
 * Options for imgproxy image processing
 */
export interface ImgproxyOptions {
  width?: number;
  height?: number;
  fit?: 'fill' | 'cover' | 'contain' | 'fit';
  format?: 'webp' | 'jpeg' | 'png';
  quality?: number;
}

/**
 * ImgProxy Service
 *
 * Generates signed URLs for serving images through imgproxy.
 * Imgproxy provides on-the-fly image processing (resize, crop, format conversion)
 * with security via HMAC-SHA256 signatures.
 *
 * @example
 * const url = imgproxyService.signedUrl(
 *   'users/123/photos/avatar.jpg',
 *   { width: 256, height: 256, fit: 'cover', format: 'webp', quality: 80 }
 * );
 * // Result: http://localhost:8081/{signature}/rs:fill:256:256/q:80/plain/...@webp
 */
@Injectable({ providedIn: 'root' })
export class ImgproxyService {
  private readonly baseUrl = environment.imgproxy.url;
  private readonly key = environment.imgproxy.key;
  private readonly salt = environment.imgproxy.salt;
  private readonly minioUrl = environment.minio.url;
  private readonly bucket = environment.minio.bucket;

  /**
   * Predefined presets for common image sizes
   */
  readonly presets = {
    thumbnail: { width: 100, height: 100, fit: 'cover' as const, format: 'webp' as const, quality: 80 },
    avatar: { width: 256, height: 256, fit: 'cover' as const, format: 'webp' as const, quality: 80 },
    avatarSmall: { width: 64, height: 64, fit: 'cover' as const, format: 'webp' as const, quality: 80 },
    avatarLarge: { width: 512, height: 512, fit: 'cover' as const, format: 'webp' as const, quality: 85 },
    card: { width: 400, height: 400, fit: 'cover' as const, format: 'webp' as const, quality: 85 },
    large: { width: 800, height: 800, fit: 'contain' as const, format: 'webp' as const, quality: 90 }
  };

  /**
   * Generate signed imgproxy URL for an S3 object
   *
   * @param s3Key S3 object key (e.g., 'users/123/photos/avatar.jpg')
   * @param options Processing options (size, format, quality)
   * @returns Signed imgproxy URL
   *
   * @example
   * const url = imgproxyService.signedUrl(
   *   'users/123/photos/avatar.jpg',
   *   { width: 256, height: 256, fit: 'cover', format: 'webp', quality: 80 }
   * );
   */
  signedUrl(s3Key: string, options: ImgproxyOptions = {}): string {
    // Build source URL (MinIO)
    const sourceUrl = `${this.minioUrl}/${this.bucket}/${s3Key}`;

    // Build processing options string
    const processingOptions = this.buildProcessingOptions(options);

    // Encode source URL to base64url
    const encodedUrl = this.base64UrlEncode(sourceUrl);

    // Build path
    let path = `/${processingOptions}/plain/${encodedUrl}`;

    // Add format extension if specified
    if (options.format) {
      path += `@${options.format}`;
    }

    // Generate signature
    const signature = this.sign(path);

    // Return complete URL
    return `${this.baseUrl}/${signature}${path}`;
  }

  /**
   * Get URL using predefined preset
   *
   * @param s3Key S3 object key
   * @param preset Preset name (thumbnail, avatar, card, large)
   * @returns Signed imgproxy URL
   *
   * @example
   * const url = imgproxyService.presetUrl('users/123/photos/avatar.jpg', 'avatar');
   */
  presetUrl(s3Key: string, preset: keyof typeof this.presets): string {
    return this.signedUrl(s3Key, this.presets[preset]);
  }

  /**
   * Build processing options string for imgproxy
   *
   * @param options Processing options
   * @returns Processing options string (e.g., "rs:fill:256:256/q:80")
   */
  private buildProcessingOptions(options: ImgproxyOptions): string {
    const parts: string[] = [];

    // Resize: rs:{fit}:{width}:{height}
    if (options.width || options.height) {
      const fit = options.fit || 'fill';
      const w = options.width || 0;
      const h = options.height || 0;
      parts.push(`rs:${fit}:${w}:${h}`);
    }

    // Quality: q:{quality}
    if (options.quality !== undefined) {
      parts.push(`q:${options.quality}`);
    }

    // If no options, return empty processing (will use defaults)
    return parts.length > 0 ? parts.join('/') : '';
  }

  /**
   * Encode string to base64url format (RFC 4648)
   *
   * @param str String to encode
   * @returns Base64url encoded string
   */
  private base64UrlEncode(str: string): string {
    // Convert to base64
    const base64 = btoa(unescape(encodeURIComponent(str)));

    // Convert to base64url (replace +, /, remove =)
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate HMAC-SHA256 signature for imgproxy
   *
   * @param path Path to sign (e.g., "/rs:fill:256:256/plain/...")
   * @returns Base64url encoded signature
   */
  private sign(path: string): string {
    // Parse hex keys to binary
    const keyBin = CryptoJS.enc.Hex.parse(this.key);
    const saltBin = CryptoJS.enc.Hex.parse(this.salt);

    // Create data to sign: salt + path
    const data = saltBin.concat(CryptoJS.enc.Utf8.parse(path));

    // Compute HMAC-SHA256
    const hmac = CryptoJS.HmacSHA256(data, keyBin);

    // Convert to base64url
    const base64 = hmac.toString(CryptoJS.enc.Base64);
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Check if imgproxy is configured
   *
   * @returns True if imgproxy is properly configured
   */
  isConfigured(): boolean {
    return !!(this.baseUrl && this.key && this.salt && this.minioUrl && this.bucket);
  }
}
