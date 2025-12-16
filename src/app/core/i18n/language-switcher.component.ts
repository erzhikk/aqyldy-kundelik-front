import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService, Language } from './language.service';

/**
 * Language Switcher Component
 * Dropdown menu for changing application language
 */
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatMenuModule, MatIconModule],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="langMenu">
      <span class="flag">{{ languageService.currentLanguage().flag }}</span>
    </button>

    <mat-menu #langMenu="matMenu">
      @for (lang of languageService.languages; track lang.code) {
        <button
          mat-menu-item
          (click)="changeLanguage(lang.code)"
          [class.active]="lang.code === languageService.currentLang()"
        >
          <span class="flag">{{ lang.flag }}</span>
          <span class="lang-name">{{ lang.name }}</span>
        </button>
      }
    </mat-menu>
  `,
  styles: [`
    .flag {
      font-size: 0.875rem;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2.2rem;
      font-weight: 600;
      padding: 0.3rem 0.6rem;
      background-color: rgba(0, 0, 0, 0.06);
      border-radius: 4px;
    }

    .lang-name {
      margin-left: 0.75rem;
    }

    .active {
      background-color: rgba(0, 0, 0, 0.04);
      font-weight: 500;
    }

    button[mat-icon-button] {
      width: auto;
      height: auto;
    }

    button[mat-icon-button] .flag {
      font-size: 0.75rem;
      min-width: auto;
      padding: 0.2rem 0.4rem;
      background-color: transparent;
    }
  `]
})
export class LanguageSwitcherComponent {
  languageService = inject(LanguageService);

  changeLanguage(lang: Language): void {
    this.languageService.setLanguage(lang);
  }
}
