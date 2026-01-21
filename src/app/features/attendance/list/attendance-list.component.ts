import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { AttendanceService, DayLessonSummary } from '../attendance.service';
import { ClassesService, ClassDto } from '../../classes/classes.service';
import { NotifyService } from '../../../core/ui/notify.service';
import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  standalone: true,
  selector: 'app-attendance-list',
  templateUrl: './attendance-list.component.html',
  styleUrls: ['./attendance-list.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule
  ]
})
export class AttendanceListComponent implements OnInit {
  private router = inject(Router);
  private attendanceApi = inject(AttendanceService);
  private classesApi = inject(ClassesService);
  private notify = inject(NotifyService);
  private lang = inject(LanguageService);

  classes = signal<ClassDto[]>([]);
  selectedClassId = signal<string>('');
  selectedDate = signal<Date>(new Date());
  lessons = signal<DayLessonSummary[]>([]);
  classCode = signal<string>('');
  loadingClasses = signal(false);
  loadingLessons = signal(false);

  dateString = computed(() => this.formatDate(this.selectedDate()));

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.loadingClasses.set(true);
    this.classesApi.listAll().subscribe({
      next: (classes) => {
        this.classes.set(classes);
        this.loadingClasses.set(false);
        // Auto-select first class
        if (classes.length > 0 && !this.selectedClassId()) {
          this.onClassChange(classes[0].id);
        }
      },
      error: () => {
        this.notify.error('ATTENDANCE.LOAD_CLASSES_ERROR');
        this.loadingClasses.set(false);
      }
    });
  }

  onClassChange(classId: string): void {
    this.selectedClassId.set(classId);
    this.loadLessons();
  }

  onDateChange(date: Date | null): void {
    if (date) {
      this.selectedDate.set(date);
      if (this.selectedClassId()) {
        this.loadLessons();
      }
    }
  }

  loadLessons(): void {
    const classId = this.selectedClassId();
    const date = this.dateString();
    if (!classId || !date) return;

    this.loadingLessons.set(true);
    this.attendanceApi.getDayLessons(classId, date).subscribe({
      next: (response) => {
        this.lessons.set(response.lessons);
        this.classCode.set(response.classCode);
        this.loadingLessons.set(false);
      },
      error: () => {
        this.notify.error('ATTENDANCE.LOAD_LESSONS_ERROR');
        this.lessons.set([]);
        this.loadingLessons.set(false);
      }
    });
  }

  getSubjectName(lesson: DayLessonSummary): string {
    const currentLang = this.lang.currentLang();
    if (currentLang === 'kk' && lesson.subjectNameKk) {
      return lesson.subjectNameKk;
    }
    return lesson.subjectNameRu;
  }

  openLesson(lesson: DayLessonSummary): void {
    const classId = this.selectedClassId();
    const date = this.dateString();
    this.router.navigate(['/app/attendance', classId, 'lessons', lesson.lessonNumber], {
      queryParams: { date }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
