import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TokenStorage } from '../core/auth/token-storage.service';
import { LoadingService } from '../core/ui/loading.service';
import { LanguageSwitcherComponent } from '../core/i18n/language-switcher.component';

type MenuItem = {
  path: string;
  label: string;
  icon: string;
  roles?: string[];
};

/**
 * Shell Component (Main Layout)
 *
 * Features:
 * - Material sidenav with menu
 * - Top toolbar with user info and logout
 * - Role-based menu items
 * - Global loading indicator
 * - Responsive design
 */
@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [
    RouterModule,
    NgIf,
    NgFor,
    AsyncPipe,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    LanguageSwitcherComponent,
    TranslateModule
  ],
  templateUrl: './shell.component.html',
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }

    .h-screen {
      height: 100vh;
    }

    .w-64 {
      width: 16rem;
    }

    .p-4 {
      padding: 1rem;
    }

    .font-semibold {
      font-weight: 600;
    }

    .text-lg {
      font-size: 1.125rem;
    }

    .border-b {
      border-bottom: 1px solid #e5e7eb;
    }

    .mr-3 {
      margin-right: 0.75rem;
    }

    .mr-2 {
      margin-right: 0.5rem;
    }

    .mr-4 {
      margin-right: 1rem;
    }

    .mr-1 {
      margin-right: 0.25rem;
    }

    .text-sm {
      font-size: 0.875rem;
    }

    .opacity-90 {
      opacity: 0.9;
    }

    .flex-1 {
      flex: 1;
    }

    .hidden {
      display: none !important;
    }

    .toolbar-sticky {
      position: sticky !important;
      top: 0 !important;
      z-index: 10 !important;
    }

    .loading-bar {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 20 !important;
    }

    .content-container {
      min-height: calc(100vh - 64px);
    }

    /* Sidebar styling */
    ::ng-deep mat-sidenav {
      border-right: 1px solid #e5e7eb;
    }

    /* Active link styling */
    ::ng-deep .mat-mdc-list-item.active {
      background-color: #eff6ff !important;
      color: #2563eb !important;
    }

    ::ng-deep .mat-mdc-list-item.active mat-icon {
      color: #2563eb !important;
    }

    /* List item hover */
    ::ng-deep .mat-mdc-list-item:hover:not(.active) {
      background-color: #f9fafb !important;
    }
  `]
})
export class ShellComponent implements OnInit {
  private tokens = inject(TokenStorage);
  private breakpointObserver = inject(BreakpointObserver);
  loader = inject(LoadingService);

  // Mobile detection
  private _isMobile = signal(false);
  isMobile = computed(() => this._isMobile());

  // Sidenav state and mode
  sidenavOpened = signal(true);
  sidenavMode = computed(() => this.isMobile() ? 'over' : 'side');

  ngOnInit(): void {
    // Detect mobile devices
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this._isMobile.set(result.matches);
      // On mobile, close sidenav by default
      if (result.matches) {
        this.sidenavOpened.set(false);
      } else {
        this.sidenavOpened.set(true);
      }
    });
  }

  /**
   * Menu items with optional role-based visibility
   * If roles not specified, item is visible to all users
   * Note: All paths use /app prefix since app lives under /app/*
   */
  menu: MenuItem[] = [
    {
      path: '/app',
      label: 'NAV.DASHBOARD',
      icon: 'dashboard'
    },
    {
      path: '/app/students',
      label: 'NAV.STUDENTS',
      icon: 'school',
      roles: ['ADMIN', 'SUPER_ADMIN', 'TEACHER']
    },
    {
      path: '/app/staff',
      label: 'NAV.STAFF',
      icon: 'badge',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      path: '/app/classes',
      label: 'NAV.CLASSES',
      icon: 'class',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      path: '/app/subjects',
      label: 'NAV.SUBJECTS',
      icon: 'menu_book'
    },
    {
      path: '/app/timetable',
      label: 'NAV.TIMETABLE',
      icon: 'event',
      roles: ['ADMIN_SCHEDULE', 'SUPER_ADMIN']
    },
    {
      path: '/app/attendance',
      label: 'NAV.ATTENDANCE',
      icon: 'check_circle',
      roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      path: '/app/assess/tests',
      label: 'NAV.TESTS',
      icon: 'assignment',
      roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN', 'ADMIN_ASSESSMENT']
    }
  ];

  /**
   * Get current user roles from token
   */
  roles(): string[] {
    const payload = this.tokens.decode() as any;
    return payload?.roles ?? [];
  }

  /**
   * Check if menu item should be shown based on user roles
   */
  canShow(item: MenuItem): boolean {
    if (!item.roles?.length) return true;
    const userRoles = this.roles();
    return item.roles.some(role => userRoles.includes(role));
  }

  /**
   * Get display name from token
   */
  displayName(): string {
    const payload = this.tokens.decode() as any;
    return payload?.fullName ?? payload?.email ?? payload?.sub ?? 'User';
  }

  /**
   * Logout user and redirect to login (root /)
   */
  logout(): void {
    // Clear all tokens
    sessionStorage.clear();
    localStorage.clear();

    // Redirect to root (login page)
    // If you have a server logout endpoint, call it here:
    // this.authService.logout().subscribe(() => { location.href = '/'; });
    location.href = '/';
  }

  /**
   * Toggle sidenav (for mobile)
   */
  toggleSidenav(): void {
    this.sidenavOpened.set(!this.sidenavOpened());
  }
}
