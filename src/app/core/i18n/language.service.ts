import { Injectable, signal, computed } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'ru' | 'kk' | 'en';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

/**
 * Language Service
 * Manages application language/locale
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly STORAGE_KEY = 'app_language';
  private readonly DEFAULT_LANGUAGE: Language = 'ru';

  // Available languages
  readonly languages: LanguageOption[] = [
    { code: 'ru', name: 'Русский', flag: 'RU' },
    { code: 'kk', name: 'Қазақша', flag: 'KK' },
    { code: 'en', name: 'English', flag: 'EN' }
  ];

  // Current language signal
  private _currentLang = signal<Language>(this.DEFAULT_LANGUAGE);
  currentLang = computed(() => this._currentLang());

  // Current language option
  currentLanguage = computed(() =>
    this.languages.find(l => l.code === this._currentLang()) || this.languages[0]
  );

  constructor(private translate: TranslateService) {
    this.initLanguage();
  }

  /**
   * Initialize language from localStorage or use default
   */
  private initLanguage(): void {
    const savedLang = localStorage.getItem(this.STORAGE_KEY) as Language;
    const lang = savedLang && this.isValidLanguage(savedLang)
      ? savedLang
      : this.DEFAULT_LANGUAGE;

    this.setLanguage(lang);
  }

  /**
   * Set application language
   */
  setLanguage(lang: Language): void {
    if (!this.isValidLanguage(lang)) {
      console.warn(`Invalid language: ${lang}. Using default.`);
      lang = this.DEFAULT_LANGUAGE;
    }

    this.translate.use(lang);
    this._currentLang.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);

    // Update HTML lang attribute for accessibility
    document.documentElement.lang = lang;
  }

  /**
   * Check if language code is valid
   */
  private isValidLanguage(lang: string): lang is Language {
    return this.languages.some(l => l.code === lang);
  }

  /**
   * Get translation for a key
   */
  instant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }
}
