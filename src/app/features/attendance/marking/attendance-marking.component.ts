import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AttendanceService,
  StudentAttendanceItem,
  LessonAttendanceResponse,
  MarkedInfo
} from '../attendance.service';
import { NotifyService } from '../../../core/ui/notify.service';
import { LanguageService } from '../../../core/i18n/language.service';

interface EditableStudent extends StudentAttendanceItem {
  originalPresent: boolean;
}

@Component({
  standalone: true,
  selector: 'app-attendance-marking',
  templateUrl: './attendance-marking.component.html',
  styleUrls: ['./attendance-marking.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatListModule,
    TranslateModule
  ]
})
export class AttendanceMarkingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private attendanceApi = inject(AttendanceService);
  private notify = inject(NotifyService);
  private lang = inject(LanguageService);

  classId = signal<string>('');
  lessonNumber = signal<number>(0);
  date = signal<string>('');

  lessonInstanceId = signal<string>('');
  classCode = signal<string>('');
  subjectNameRu = signal<string>('');
  subjectNameKk = signal<string>('');
  teacherFullName = signal<string>('');
  students = signal<EditableStudent[]>([]);
  markedInfo = signal<MarkedInfo | null>(null);

  loading = signal(false);
  saving = signal(false);

  // Computed for "select all" checkbox
  allPresent = computed(() => {
    const list = this.students();
    return list.length > 0 && list.every(s => s.present);
  });

  somePresent = computed(() => {
    const list = this.students();
    const presentCount = list.filter(s => s.present).length;
    return presentCount > 0 && presentCount < list.length;
  });

  hasChanges = computed(() => {
    return this.students().some(s => s.present !== s.originalPresent);
  });

  subjectName = computed(() => {
    const currentLang = this.lang.currentLang();
    if (currentLang === 'kk' && this.subjectNameKk()) {
      return this.subjectNameKk();
    }
    return this.subjectNameRu();
  });

  presentCount = computed(() => this.students().filter(s => s.present).length);
  totalCount = computed(() => this.students().length);

  ngOnInit(): void {
    const classId = this.route.snapshot.paramMap.get('classId');
    const lessonNumber = this.route.snapshot.paramMap.get('lessonNumber');
    const date = this.route.snapshot.queryParamMap.get('date');

    if (classId && lessonNumber && date) {
      this.classId.set(classId);
      this.lessonNumber.set(parseInt(lessonNumber, 10));
      this.date.set(date);
      this.load();
    } else {
      this.goBack();
    }
  }

  load(): void {
    this.loading.set(true);
    this.attendanceApi.getLessonAttendance(this.classId(), this.date(), this.lessonNumber()).subscribe({
      next: (response) => {
        this.lessonInstanceId.set(response.lessonInstanceId);
        this.classCode.set(response.classCode);
        this.subjectNameRu.set(response.subjectNameRu);
        this.subjectNameKk.set(response.subjectNameKk || '');
        this.teacherFullName.set(response.teacherFullName || '');
        this.markedInfo.set(response.markedInfo || null);

        const editableStudents: EditableStudent[] = response.students.map(s => ({
          ...s,
          originalPresent: s.present
        }));
        this.students.set(editableStudents);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('ATTENDANCE.LOAD_ERROR');
        this.loading.set(false);
      }
    });
  }

  onSelectAllChange(): void {
    // Toggle: if all present → set all absent, otherwise set all present
    const allPresent = this.allPresent();
    const updated = this.students().map(s => ({ ...s, present: !allPresent }));
    this.students.set(updated);
  }

  onStudentChange(student: EditableStudent, checked: boolean): void {
    student.present = checked;
    this.students.set([...this.students()]);
  }

  save(): void {
    if (!this.lessonInstanceId()) return;

    this.saving.set(true);
    const request = {
      items: this.students().map(s => ({
        studentId: s.studentId,
        present: s.present
      }))
    };

    this.attendanceApi.saveLessonAttendance(this.lessonInstanceId(), request).subscribe({
      next: (response) => {
        // Update from response
        this.markedInfo.set(response.markedInfo || null);
        const editableStudents: EditableStudent[] = response.students.map(s => ({
          ...s,
          originalPresent: s.present
        }));
        this.students.set(editableStudents);
        this.notify.success('ATTENDANCE.SAVE_SUCCESS');
        this.saving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 400 && error.error?.message) {
          this.notify.error(error.error.message);
        } else {
          this.notify.error('ATTENDANCE.SAVE_ERROR');
        }
        this.saving.set(false);
      }
    });
  }

  reset(): void {
    const resetStudents = this.students().map(s => ({
      ...s,
      present: s.originalPresent
    }));
    this.students.set(resetStudents);
  }

  goBack(): void {
    this.router.navigate(['/app/attendance']);
  }

  formatMarkedAt(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  }
}
