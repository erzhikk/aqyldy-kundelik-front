import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import {
  ScheduleService,
  ScheduleCell,
  ScheduleConflict,
  ClassScheduleResponse,
  ScheduleStatus,
  CRITICAL_CONFLICT_TYPES
} from './schedule.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AssignmentsService, ClassAssignmentItem } from '../assignments/assignments.service';
import { NotifyService } from '../../../core/ui/notify.service';

interface GridCell {
  dayOfWeek: number;
  lessonNumber: number;
  subjectId: string | null;
  subjectNameRu?: string;
  teacherFullName?: string;
  originalSubjectId: string | null;
}

interface SubjectOption {
  id: string;
  name: string;
}

@Component({
  standalone: true,
  selector: 'app-class-schedule',
  templateUrl: './class-schedule.component.html',
  styleUrls: ['./class-schedule.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    TranslateModule
  ]
})
export class ClassScheduleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private scheduleApi = inject(ScheduleService);
  private assignmentsApi = inject(AssignmentsService);
  private notify = inject(NotifyService);

  classId = signal<string>('');
  classCode = signal<string>('');
  scheduleId = signal<string>('');
  status = signal<ScheduleStatus>('DRAFT');
  daysPerWeek = signal(5);
  lessonsPerDay = signal(7);
  grid = signal<GridCell[][]>([]);
  conflicts = signal<ScheduleConflict[]>([]);
  subjects = signal<SubjectOption[]>([]);
  loading = signal(false);
  saving = signal(false);
  activating = signal(false);

  dayNames = ['ADMIN.SCHEDULE.MON', 'ADMIN.SCHEDULE.TUE', 'ADMIN.SCHEDULE.WED', 'ADMIN.SCHEDULE.THU', 'ADMIN.SCHEDULE.FRI', 'ADMIN.SCHEDULE.SAT'];

  days = computed(() => Array.from({ length: this.daysPerWeek() }, (_, i) => i + 1));
  lessons = computed(() => Array.from({ length: this.lessonsPerDay() }, (_, i) => i + 1));

  hasChanges = computed(() => {
    return this.grid().some(row =>
      row.some(cell => cell.subjectId !== cell.originalSubjectId)
    );
  });

  // Critical conflicts (block activation)
  teacherBusyConflicts = computed(() =>
    this.conflicts().filter(c => c.type === 'TEACHER_BUSY')
  );

  planExceedsSlotsConflicts = computed(() =>
    this.conflicts().filter(c => c.type === 'PLAN_EXCEEDS_SLOTS')
  );

  invalidSlotRangeConflicts = computed(() =>
    this.conflicts().filter(c => c.type === 'INVALID_SLOT_RANGE')
  );

  // Warning conflicts (don't block activation)
  maxLessonsExceededConflicts = computed(() =>
    this.conflicts().filter(c => c.type === 'MAX_LESSONS_EXCEEDED')
  );

  hoursMismatchConflicts = computed(() =>
    this.conflicts().filter(c => c.type === 'HOURS_MISMATCH')
  );

  // Check if any critical conflicts exist
  hasCriticalConflicts = computed(() =>
    this.conflicts().some(c => CRITICAL_CONFLICT_TYPES.includes(c.type))
  );

  ngOnInit(): void {
    const classId = this.route.snapshot.paramMap.get('classId');
    if (classId) {
      this.classId.set(classId);
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      schedule: this.scheduleApi.getClassSchedule(this.classId()),
      assignments: this.assignmentsApi.getClassAssignments(this.classId())
    }).subscribe({
      next: ({ schedule, assignments }) => {
        this.classCode.set(assignments.classCode);
        this.scheduleId.set(schedule.scheduleId);
        this.status.set(schedule.status);
        this.daysPerWeek.set(schedule.daysPerWeek);
        this.lessonsPerDay.set(schedule.lessonsPerDay);
        this.conflicts.set(schedule.conflicts);

        // Build subject options from assignments
        const subjectOptions: SubjectOption[] = assignments.items.map(item => ({
          id: item.subjectId,
          name: item.subjectNameRu
        }));
        this.subjects.set(subjectOptions);

        // Build grid
        this.buildGrid(schedule);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('ADMIN.SCHEDULE.LOAD_ERROR');
        this.loading.set(false);
      }
    });
  }

  private buildGrid(schedule: ClassScheduleResponse): void {
    const gridMap = new Map<string, ScheduleCell>();
    schedule.grid.forEach(cell => {
      gridMap.set(`${cell.dayOfWeek}-${cell.lessonNumber}`, cell);
    });

    const newGrid: GridCell[][] = [];
    for (let lesson = 1; lesson <= schedule.lessonsPerDay; lesson++) {
      const row: GridCell[] = [];
      for (let day = 1; day <= schedule.daysPerWeek; day++) {
        const existing = gridMap.get(`${day}-${lesson}`);
        row.push({
          dayOfWeek: day,
          lessonNumber: lesson,
          subjectId: existing?.subjectId || null,
          subjectNameRu: existing?.subjectNameRu,
          teacherFullName: existing?.teacherFullName,
          originalSubjectId: existing?.subjectId || null
        });
      }
      newGrid.push(row);
    }
    this.grid.set(newGrid);
  }

  getCell(lessonNumber: number, dayOfWeek: number): GridCell | undefined {
    const row = this.grid()[lessonNumber - 1];
    return row?.[dayOfWeek - 1];
  }

  onCellChange(cell: GridCell, subjectId: string | null): void {
    cell.subjectId = subjectId;
    const subject = this.subjects().find(s => s.id === subjectId);
    cell.subjectNameRu = subject?.name;
    // Trigger change detection
    this.grid.set([...this.grid()]);
  }

  getSubjectName(subjectId: string | null): string {
    if (!subjectId) return '';
    const subject = this.subjects().find(s => s.id === subjectId);
    return subject?.name || '';
  }

  isCellChanged(cell: GridCell): boolean {
    return cell.subjectId !== cell.originalSubjectId;
  }

  hasCellConflict(cell: GridCell): boolean {
    return this.conflicts().some(c =>
      c.dayOfWeek === cell.dayOfWeek && c.lessonNumber === cell.lessonNumber
    );
  }

  copyDay(fromDay: number): void {
    const sourceColumn = this.grid().map(row => row[fromDay - 1]);

    // Show menu or copy to next day
    const targetDay = fromDay < this.daysPerWeek() ? fromDay + 1 : 1;
    this.grid().forEach((row, lessonIdx) => {
      const targetCell = row[targetDay - 1];
      const sourceCell = sourceColumn[lessonIdx];
      targetCell.subjectId = sourceCell.subjectId;
      targetCell.subjectNameRu = sourceCell.subjectNameRu;
    });
    this.grid.set([...this.grid()]);
    this.notify.info('ADMIN.SCHEDULE.DAY_COPIED');
  }

  clearDay(day: number): void {
    this.grid().forEach(row => {
      const cell = row[day - 1];
      cell.subjectId = null;
      cell.subjectNameRu = undefined;
    });
    this.grid.set([...this.grid()]);
  }

  clearLesson(lesson: number): void {
    const row = this.grid()[lesson - 1];
    row.forEach(cell => {
      cell.subjectId = null;
      cell.subjectNameRu = undefined;
    });
    this.grid.set([...this.grid()]);
  }

  save(): void {
    this.saving.set(true);
    const gridData = this.grid().flatMap(row =>
      row.map(cell => ({
        dayOfWeek: cell.dayOfWeek,
        lessonNumber: cell.lessonNumber,
        subjectId: cell.subjectId
      }))
    );

    const request = {
      daysPerWeek: this.daysPerWeek(),
      lessonsPerDay: this.lessonsPerDay(),
      grid: gridData
    };

    this.scheduleApi.saveClassSchedule(this.classId(), request).subscribe({
      next: (response) => {
        this.conflicts.set(response.conflicts);
        // Update original values
        this.grid().forEach(row => {
          row.forEach(cell => {
            cell.originalSubjectId = cell.subjectId;
          });
        });
        this.grid.set([...this.grid()]);
        this.notify.success('ADMIN.SCHEDULE.SAVE_SUCCESS');
        this.saving.set(false);
      },
      error: () => {
        this.notify.error('ADMIN.SCHEDULE.SAVE_ERROR');
        this.saving.set(false);
      }
    });
  }

  activate(): void {
    // Critical conflicts block activation - button should be disabled
    // This is a safeguard in case button is somehow clicked
    if (this.hasCriticalConflicts()) {
      return;
    }
    this.doActivate();
  }

  private doActivate(): void {
    this.activating.set(true);
    this.scheduleApi.activateSchedule(this.classId()).subscribe({
      next: (response) => {
        this.status.set(response.status);
        this.conflicts.set(response.conflicts);
        this.notify.success('ADMIN.SCHEDULE.ACTIVATE_SUCCESS');
        this.activating.set(false);
      },
      error: (error: HttpErrorResponse) => {
        // Handle 409 Conflict - backend rejected activation due to critical conflicts
        if (error.status === 409 && error.error?.conflicts) {
          this.conflicts.set(error.error.conflicts);
          this.notify.error('ADMIN.SCHEDULE.ACTIVATION_BLOCKED');
        } else {
          this.notify.error('ADMIN.SCHEDULE.ACTIVATE_ERROR');
        }
        this.activating.set(false);
      }
    });
  }

  reset(): void {
    this.grid().forEach(row => {
      row.forEach(cell => {
        cell.subjectId = cell.originalSubjectId;
        if (cell.originalSubjectId) {
          const subject = this.subjects().find(s => s.id === cell.originalSubjectId);
          cell.subjectNameRu = subject?.name;
        } else {
          cell.subjectNameRu = undefined;
        }
      });
    });
    this.grid.set([...this.grid()]);
  }

  goBack(): void {
    this.router.navigate(['/app/admin/classes', this.classId(), 'assignments']);
  }
}
