import { Component, OnInit, inject, computed, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectsService, SubjectDto, ClassLevelDto } from '../subjects.service';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { SubjectCreateComponent } from '../create/subject-create.component';
import { SubjectEditComponent } from '../edit/subject-edit.component';
import { TokenStorage } from '../../../core/auth/token-storage.service';
import { LanguageService } from '../../../core/i18n/language.service';

/**
 * Subjects List Component
 *
 * Features:
 * - Displays subjects in Material table
 * - Create button (only for ADMIN/SUPER_ADMIN)
 * - Auto-refresh after creating subject
 * - Uses all interceptors (loading, auth, error)
 */
@Component({
  standalone: true,
  selector: 'app-subjects-list',
  templateUrl: './subjects-list.component.html',
  styleUrls: ['./subjects-list.component.scss'],
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    TranslateModule
  ]
})
export class SubjectsListComponent implements OnInit {
  private api = inject(SubjectsService);
  private dialog = inject(MatDialog);
  private tokens = inject(TokenStorage);
  languageService = inject(LanguageService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Table columns to display
  displayed = ['name', 'classLevel', 'actions'];

  // Reactive state using signals
  private _subjects = signal<SubjectDto[]>([]);
  subjects = computed(() => this._subjects());

  // Pagination state
  private _totalElements = signal(0);
  totalElements = computed(() => this._totalElements());
  pageSize = 10;
  pageIndex = 0;

  ngOnInit(): void {
    this.load();
  }

  /**
   * Load subjects from API
   * Automatically shows loading spinner via loading interceptor
   * Automatically shows errors via error interceptor
   */
  load(): void {
    this.api.listPaged(this.pageIndex, this.pageSize).subscribe({
      next: (response) => {
        this._subjects.set(response.content || []);
        this._totalElements.set(response.totalElements || 0);
      }
      // Errors handled automatically by error interceptor
    });
  }

  /**
   * Handle page change event from paginator
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  /**
   * Check if current user can create subjects
   * Only ADMIN and SUPER_ADMIN can create subjects
   */
  canCreate(): boolean {
    const roles = this.tokens.decode()?.roles ?? [];
    return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
  }

  /**
   * Open create subject dialog
   * Refreshes list if subject was created
   */
  openCreate(): void {
    const dialogRef = this.dialog.open(SubjectCreateComponent, {
      width: '50vw',
      minWidth: '320px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      disableClose: false,
      hasBackdrop: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe((createdSubject) => {
      if (createdSubject) {
        console.log('Subject created:', createdSubject);
        this.load(); // Refresh the list
      }
    });
  }

  /**
   * Open edit subject dialog
   * Refreshes list if subject was updated
   */
  openEdit(subject: SubjectDto): void {
    const dialogRef = this.dialog.open(SubjectEditComponent, {
      width: '50vw',
      minWidth: '320px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      disableClose: false,
      hasBackdrop: true,
      panelClass: 'custom-dialog-container',
      data: subject
    });

    dialogRef.afterClosed().subscribe((updatedSubject) => {
      if (updatedSubject) {
        console.log('Subject updated:', updatedSubject);
        this.load(); // Refresh the list
      }
    });
  }

  /**
   * Get localized subject name based on current language
   */
  getSubjectName(subject: SubjectDto): string {
    const lang = this.languageService.currentLang();
    switch (lang) {
      case 'ru':
        return subject.nameRu;
      case 'kk':
        return subject.nameKk;
      case 'en':
        return subject.nameEn;
      default:
        return subject.nameRu;
    }
  }

  /**
   * Get localized class level name based on current language
   */
  getClassLevelName(classLevel: ClassLevelDto): string {
    const lang = this.languageService.currentLang();
    switch (lang) {
      case 'ru':
        return classLevel.nameRu;
      case 'kk':
        return classLevel.nameKk;
      default:
        return classLevel.nameRu;
    }
  }

}
