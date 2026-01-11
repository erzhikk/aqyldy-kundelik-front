import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MediaService } from '../../../core/services/media.service';
import { ImgproxyService } from '../../../core/services/imgproxy.service';
import { ImgproxyPipe } from '../../pipes/imgproxy.pipe';
import { environment } from '../../../../environments/environment';

/**
 * Upload state type
 */
type UploadStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

/**
 * Upload Avatar Component
 *
 * Provides complete avatar upload functionality:
 * 1. File selection with validation
 * 2. Client-side validation (size, type, dimensions)
 * 3. Preview of selected image
 * 4. Direct upload to backend (backend handles MinIO upload)
 * 5. Progress indication and status messages
 * 6. Returns mediaObjectId for linking to user
 *
 * @example
 * <app-upload-avatar
 *   [userId]="user.id"
 *   [currentAvatarKey]="user.photoKey"
 *   [currentAvatarUrl]="user.photoUrl"
 *   [size]="'medium'"
 *   (uploadSuccess)="onAvatarUploaded($event)"
 *   (uploadError)="onAvatarError($event)"
 * ></app-upload-avatar>
 */
@Component({
  selector: 'app-upload-avatar',
  standalone: true,
  templateUrl: './upload-avatar.component.html',
  styleUrls: ['./upload-avatar.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ImgproxyPipe
  ]
})
export class UploadAvatarComponent {
  /**
   * User ID for upload
   */
  @Input({ required: true }) userId!: string;

  /**
   * Current avatar S3 key (for preview)
   */
  @Input() currentAvatarKey?: string;

  /**
   * Current avatar presigned URL (for preview)
   */
  @Input() currentAvatarUrl?: string | null;

  /**
   * Avatar preview size
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Upload mode: direct upload or parent-managed
   */
  @Input() uploadMode: 'direct' | 'manual' = 'direct';

  /**
   * Emits upload result when upload succeeds
   */
  @Output() uploadSuccess = new EventEmitter<{ s3Key: string; mediaObjectId: string }>();

  /**
   * Emits error message when upload fails
   */
  @Output() uploadError = new EventEmitter<string>();

  /**
   * Emits selected file when upload is managed by parent
   */
  @Output() fileSelected = new EventEmitter<File>();

  /**
   * Emits when selected file is cleared
   */
  @Output() fileCleared = new EventEmitter<void>();

  // Upload limits from environment
  private readonly maxFileSize = environment.upload.maxFileSize;
  private readonly allowedTypes = environment.upload.allowedTypes;
  private readonly minDimension = environment.upload.minDimension;
  private readonly maxDimension = environment.upload.maxDimension;

  // State signals
  private _file = signal<File | null>(null);
  private _previewUrl = signal<string | null>(null);
  private _uploading = signal(false);
  private _progress = signal(0);
  private _status = signal<UploadStatus>('idle');
  private _errorMessage = signal<string | null>(null);
  private _uploadedKey = signal<string | null>(null);

  // Computed values
  file = computed(() => this._file());
  previewUrl = computed(() => this._previewUrl());
  uploading = computed(() => this._uploading());
  progress = computed(() => this._progress());
  status = computed(() => this._status());
  errorMessage = computed(() => this._errorMessage());
  uploadedKey = computed(() => this._uploadedKey());

  constructor(
    private mediaService: MediaService,
    private imgproxyService: ImgproxyService
  ) {}

  /**
   * Handle file selection
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    try {
      this._status.set('validating');
      this._errorMessage.set(null);

      // 1. Validate file type
      if (!this.isValidFileType(file)) {
        throw new Error('РќРµРїРѕРґРґРµСЂР¶РёРІР°РµРјС‹Р№ С„РѕСЂРјР°С‚. РСЃРїРѕР»СЊР·СѓР№С‚Рµ JPEG, PNG РёР»Рё WebP');
      }

      // 2. Validate file size
      if (file.size > this.maxFileSize) {
        const maxMB = (this.maxFileSize / (1024 * 1024)).toFixed(0);
        throw new Error(`Р¤Р°Р№Р» СЃР»РёС€РєРѕРј Р±РѕР»СЊС€РѕР№. РњР°РєСЃРёРјСѓРј ${maxMB} РњР‘`);
      }

      // 3. Validate image dimensions
      const dimensions = await this.getImageDimensions(file);
      if (dimensions.width < this.minDimension || dimensions.height < this.minDimension) {
        throw new Error(
          `РР·РѕР±СЂР°Р¶РµРЅРёРµ СЃР»РёС€РєРѕРј РјР°Р»РµРЅСЊРєРѕРµ. РњРёРЅРёРјСѓРј ${this.minDimension}Г—${this.minDimension} РїРёРєСЃРµР»РµР№`
        );
      }
      if (dimensions.width > this.maxDimension || dimensions.height > this.maxDimension) {
        throw new Error(
          `РР·РѕР±СЂР°Р¶РµРЅРёРµ СЃР»РёС€РєРѕРј Р±РѕР»СЊС€РѕРµ. РњР°РєСЃРёРјСѓРј ${this.maxDimension}Г—${this.maxDimension} РїРёРєСЃРµР»РµР№`
        );
      }

      // 4. Check for animated images (basic check)
      if (await this.isAnimated(file)) {
        throw new Error('РђРЅРёРјРёСЂРѕРІР°РЅРЅС‹Рµ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°СЋС‚СЃСЏ');
      }

      // 5. Create preview
      const previewUrl = await this.createPreviewUrl(file);

      // Success - update state
      this._file.set(file);
      this._previewUrl.set(previewUrl);
      this._status.set('idle');
      this._errorMessage.set(null);

      this.fileSelected.emit(file);

    } catch (error: any) {
      this.showError(error.message || 'РћС€РёР±РєР° РІР°Р»РёРґР°С†РёРё С„Р°Р№Р»Р°');
      // Reset input
      input.value = '';
    }
  }

  /**
   * Upload selected file using direct upload (through backend)
   */
  async upload(): Promise<void> {
    const file = this._file();
    if (!file) return;

    try {
      this._uploading.set(true);
      this._status.set('uploading');
      this._progress.set(0);
      this._errorMessage.set(null);

      // Upload directly through backend (bypasses CORS)
      const result = await this.mediaService.uploadPhotoDirect(
        this.userId,
        file,
        (progress) => {
          this._progress.set(progress);
        }
      );

      // Success
      this._status.set('success');
      this._progress.set(100);
      this._uploadedKey.set(result.key);

      // Emit success event with both s3Key and mediaObjectId
      this.uploadSuccess.emit({
        s3Key: result.key,
        mediaObjectId: result.mediaObjectId
      });

      // Clear file after successful upload
      setTimeout(() => {
        this._file.set(null);
        this._status.set('idle');
      }, 2000);

    } catch (error: any) {
      this.showError(error.message || 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё С„Р°Р№Р»Р°');
      this.uploadError.emit(this._errorMessage()!);
    } finally {
      this._uploading.set(false);
    }
  }

  /**
   * Get preview URL for current or uploaded avatar
   */
  getAvatarPreviewUrl(): string | null {
    // Priority: local preview > uploaded key > current URL > current key
    if (this._previewUrl()) {
      return this._previewUrl();
    }

    if (this._uploadedKey()) {
      return this.imgproxyService.presetUrl(this._uploadedKey()!, 'avatar');
    }

    if (this.currentAvatarUrl) {
      return this.currentAvatarUrl;
    }

    if (this.currentAvatarKey) {
      return this.imgproxyService.presetUrl(this.currentAvatarKey, 'avatar');
    }

    return null;
  }

  /**
   * Validate file type
   */
  private isValidFileType(file: File): boolean {
    return this.allowedTypes.includes(file.type);
  }

  /**
   * Get image dimensions
   */
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ'));
      };

      img.src = url;
    });
  }

  /**
   * Check if image is animated (basic check for GIF)
   */
  private async isAnimated(file: File): Promise<boolean> {
    // Only check GIF files
    if (file.type !== 'image/gif') {
      return false;
    }

    // Read file as ArrayBuffer
    const buffer = await file.arrayBuffer();
    const arr = new Uint8Array(buffer);

    // Look for multiple image descriptors (simple heuristic)
    let imageDescriptorCount = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === 0x21 && arr[i + 1] === 0xF9) {
        imageDescriptorCount++;
        if (imageDescriptorCount > 1) {
          return true; // Animated
        }
      }
    }

    return false;
  }

  /**
   * Create preview URL from file
   */
  private createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };

      reader.onerror = () => {
        reject(new Error('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РїСЂРµРІСЊСЋ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this._status.set('error');
    this._errorMessage.set(message);
  }

  /**
   * Cancel upload
   */
  cancel(): void {
    this._file.set(null);
    this._previewUrl.set(null);
    this._status.set('idle');
    this._errorMessage.set(null);
    this._progress.set(0);
    this.fileCleared.emit();
  }
}
