import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { CurriculumService, CurriculumLevel, CurriculumSubjectItem } from './curriculum.service';
import { NotifyService } from '../../../core/ui/notify.service';
import { LanguageService } from '../../../core/i18n/language.service';

interface EditableSubject extends CurriculumSubjectItem {
  originalHours: number;
  hasError: boolean;
}

@Component({
  standalone: true,
  selector: 'app-curriculum-editor',
  templateUrl: './curriculum-editor.component.html',
  styleUrls: ['./curriculum-editor.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    TranslateModule
  ]
})
export class CurriculumEditorComponent implements OnInit {
  private api = inject(CurriculumService);
  private notify = inject(NotifyService);
  private lang = inject(LanguageService);

  levels = signal<CurriculumLevel[]>([]);
  selectedLevel = signal<CurriculumLevel | null>(null);
  subjects = signal<EditableSubject[]>([]);
  maxLessonsPerDay = signal(7);
  originalMaxLessonsPerDay = signal(7);
  maxHoursPerWeek = signal(35);
  serverTotalHours = signal(0);
  warnings = signal<string[]>([]);
  loading = signal(false);
  saving = signal(false);
  savingSettings = signal(false);
  editingMaxLessons = signal(false);

  displayedColumns = ['subject', 'hoursPerWeek'];

  totalHours = computed(() => {
    return this.subjects().reduce((sum, s) => sum + (s.hoursPerWeek || 0), 0);
  });

  hoursProgress = computed(() => {
    const max = this.maxHoursPerWeek();
    if (max <= 0) return 0;
    return Math.min((this.totalHours() / max) * 100, 100);
  });

  isOverLimit = computed(() => {
    return this.totalHours() > this.maxHoursPerWeek();
  });

  hasChanges = computed(() => {
    return this.subjects().some(s => s.hoursPerWeek !== s.originalHours);
  });

  hasErrors = computed(() => {
    return this.subjects().some(s => s.hasError);
  });

  ngOnInit(): void {
    this.loadLevels();
  }

  loadLevels(): void {
    this.loading.set(true);
    this.api.getLevels().subscribe({
      next: (levels) => {
        this.levels.set(levels.sort((a, b) => a.level - b.level));
        this.loading.set(false);
        // Auto-select first level
        if (levels.length > 0) {
          this.selectLevel(levels[0]);
        }
      },
      error: () => {
        this.notify.error('ADMIN.CURRICULUM.LOAD_LEVELS_ERROR');
        this.loading.set(false);
      }
    });
  }

  selectLevel(level: CurriculumLevel): void {
    this.selectedLevel.set(level);
    this.loadSubjects(level.id);
  }

  loadSubjects(classLevelId: string): void {
    this.loading.set(true);
    this.api.getSubjects(classLevelId).subscribe({
      next: (response) => {
        const editableSubjects: EditableSubject[] = response.subjects.map(s => ({
          ...s,
          originalHours: s.hoursPerWeek,
          hasError: false
        }));
        this.subjects.set(editableSubjects);
        this.maxLessonsPerDay.set(response.maxLessonsPerDay);
        this.originalMaxLessonsPerDay.set(response.maxLessonsPerDay);
        this.maxHoursPerWeek.set(response.maxHoursPerWeek);
        this.serverTotalHours.set(response.totalHoursPerWeek);
        this.warnings.set(response.warnings || []);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('ADMIN.CURRICULUM.LOAD_SUBJECTS_ERROR');
        this.loading.set(false);
      }
    });
  }

  onMaxLessonsChange(value: string): void {
    const lessons = parseInt(value, 10);
    if (!isNaN(lessons) && lessons >= 1 && lessons <= 10) {
      this.maxLessonsPerDay.set(lessons);
    }
  }

  saveMaxLessons(): void {
    const level = this.selectedLevel();
    if (!level || this.maxLessonsPerDay() === this.originalMaxLessonsPerDay()) return;

    this.savingSettings.set(true);
    this.api.updateLevelSettings(level.id, { maxLessonsPerDay: this.maxLessonsPerDay() }).subscribe({
      next: (updatedLevel) => {
        this.originalMaxLessonsPerDay.set(updatedLevel.maxLessonsPerDay);
        this.maxLessonsPerDay.set(updatedLevel.maxLessonsPerDay);
        // Update in levels list
        const updatedLevels = this.levels().map(l =>
          l.id === updatedLevel.id ? updatedLevel : l
        );
        this.levels.set(updatedLevels);
        this.selectedLevel.set(updatedLevel);
        this.editingMaxLessons.set(false);
        this.notify.success('ADMIN.CURRICULUM.SETTINGS_SAVED');
        this.savingSettings.set(false);
      },
      error: () => {
        this.notify.error('ADMIN.CURRICULUM.SETTINGS_ERROR');
        this.savingSettings.set(false);
      }
    });
  }

  cancelMaxLessonsEdit(): void {
    this.maxLessonsPerDay.set(this.originalMaxLessonsPerDay());
    this.editingMaxLessons.set(false);
  }

  onHoursChange(subject: EditableSubject, value: string): void {
    const hours = parseInt(value, 10);
    subject.hoursPerWeek = isNaN(hours) ? 0 : hours;
    subject.hasError = hours < 0 || hours > 12;
    // Trigger change detection
    this.subjects.set([...this.subjects()]);
  }

  getSubjectName(subject: EditableSubject): string {
    const currentLang = this.lang.currentLang();
    if (currentLang === 'kk') return subject.nameKk || subject.nameRu;
    if (currentLang === 'en') return subject.nameEn || subject.nameRu;
    return subject.nameRu;
  }

  getLevelName(level: CurriculumLevel): string {
    const currentLang = this.lang.currentLang();
    if (currentLang === 'kk') return level.nameKk || level.nameRu;
    return level.nameRu;
  }

  save(): void {
    if (this.hasErrors() || !this.selectedLevel()) return;

    this.saving.set(true);
    const request = {
      items: this.subjects().map(s => ({
        subjectId: s.subjectId,
        hoursPerWeek: s.hoursPerWeek
      }))
    };

    this.api.updateSubjects(this.selectedLevel()!.id, request).subscribe({
      next: (response) => {
        const editableSubjects: EditableSubject[] = response.subjects.map(s => ({
          ...s,
          originalHours: s.hoursPerWeek,
          hasError: false
        }));
        this.subjects.set(editableSubjects);
        this.maxLessonsPerDay.set(response.maxLessonsPerDay);
        this.maxHoursPerWeek.set(response.maxHoursPerWeek);
        this.serverTotalHours.set(response.totalHoursPerWeek);
        this.warnings.set(response.warnings || []);
        this.notify.success('ADMIN.CURRICULUM.SAVE_SUCCESS');
        this.saving.set(false);
      },
      error: () => {
        this.notify.error('ADMIN.CURRICULUM.SAVE_ERROR');
        this.saving.set(false);
      }
    });
  }

  reset(): void {
    const resetSubjects = this.subjects().map(s => ({
      ...s,
      hoursPerWeek: s.originalHours,
      hasError: false
    }));
    this.subjects.set(resetSubjects);
  }
}
