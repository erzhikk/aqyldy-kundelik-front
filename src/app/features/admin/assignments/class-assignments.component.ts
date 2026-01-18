import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import {
  AssignmentsService,
  ClassAssignmentItem,
  TeacherShort
} from './assignments.service';
import { NotifyService } from '../../../core/ui/notify.service';

interface EditableAssignment extends ClassAssignmentItem {
  originalTeacherId: string | null;
  searchControl: FormControl<string | null>;
  filteredTeachers: TeacherShort[];
  searching: boolean;
}

@Component({
  standalone: true,
  selector: 'app-class-assignments',
  templateUrl: './class-assignments.component.html',
  styleUrls: ['./class-assignments.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    TranslateModule
  ]
})
export class ClassAssignmentsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(AssignmentsService);
  private notify = inject(NotifyService);

  classId = signal<string>('');
  classCode = signal<string>('');
  assignments = signal<EditableAssignment[]>([]);
  loading = signal(false);
  saving = signal(false);

  displayedColumns = ['subject', 'teacher', 'actions'];

  hasChanges = computed(() => {
    return this.assignments().some(a => a.teacherId !== a.originalTeacherId);
  });

  unassignedCount = computed(() => {
    return this.assignments().filter(a => !a.teacherId).length;
  });

  ngOnInit(): void {
    const classId = this.route.snapshot.paramMap.get('classId');
    if (classId) {
      this.classId.set(classId);
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.api.getClassAssignments(this.classId()).subscribe({
      next: (response) => {
        this.classCode.set(response.classCode);
        const editableAssignments: EditableAssignment[] = response.items.map(item => {
          const searchControl = new FormControl<string>(item.teacherFullName || '');
          const assignment: EditableAssignment = {
            ...item,
            originalTeacherId: item.teacherId,
            searchControl,
            filteredTeachers: [],
            searching: false
          };
          this.setupAutocomplete(assignment);
          return assignment;
        });
        this.assignments.set(editableAssignments);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('ADMIN.ASSIGNMENTS.LOAD_ERROR');
        this.loading.set(false);
      }
    });
  }

  private setupAutocomplete(assignment: EditableAssignment): void {
    assignment.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (!value || value.length < 2) {
          assignment.filteredTeachers = [];
          assignment.searching = false;
          return of([]);
        }
        assignment.searching = true;
        return this.api.searchTeachers(value);
      })
    ).subscribe({
      next: (teachers) => {
        assignment.filteredTeachers = teachers;
        assignment.searching = false;
      },
      error: () => {
        assignment.searching = false;
      }
    });
  }

  selectTeacher(assignment: EditableAssignment, teacher: TeacherShort): void {
    assignment.teacherId = teacher.id;
    assignment.teacherFullName = teacher.fullName;
    assignment.teacherEmail = teacher.email;
    assignment.searchControl.setValue(teacher.fullName, { emitEvent: false });
    assignment.filteredTeachers = [];
    // Trigger change detection
    this.assignments.set([...this.assignments()]);
  }

  clearTeacher(assignment: EditableAssignment): void {
    assignment.teacherId = null;
    assignment.teacherFullName = undefined;
    assignment.teacherEmail = undefined;
    assignment.searchControl.setValue('', { emitEvent: false });
    // Trigger change detection
    this.assignments.set([...this.assignments()]);
  }

  displayTeacher(teacher: TeacherShort): string {
    return teacher?.fullName || '';
  }

  save(): void {
    this.saving.set(true);
    const request = {
      items: this.assignments().map(a => ({
        subjectId: a.subjectId,
        teacherId: a.teacherId
      }))
    };

    this.api.updateClassAssignments(this.classId(), request).subscribe({
      next: (response) => {
        const editableAssignments: EditableAssignment[] = response.items.map(item => {
          const existing = this.assignments().find(a => a.subjectId === item.subjectId);
          const searchControl = existing?.searchControl || new FormControl<string>(item.teacherFullName || '');
          if (existing) {
            searchControl.setValue(item.teacherFullName || '', { emitEvent: false });
          }
          const assignment: EditableAssignment = {
            ...item,
            originalTeacherId: item.teacherId,
            searchControl,
            filteredTeachers: [],
            searching: false
          };
          if (!existing) {
            this.setupAutocomplete(assignment);
          }
          return assignment;
        });
        this.assignments.set(editableAssignments);
        this.notify.success('ADMIN.ASSIGNMENTS.SAVE_SUCCESS');
        this.saving.set(false);
      },
      error: () => {
        this.notify.error('ADMIN.ASSIGNMENTS.SAVE_ERROR');
        this.saving.set(false);
      }
    });
  }

  reset(): void {
    const resetAssignments = this.assignments().map(a => {
      const originalTeacher = a.originalTeacherId ? {
        fullName: a.teacherFullName,
        email: a.teacherEmail
      } : null;
      a.teacherId = a.originalTeacherId;
      if (a.originalTeacherId && originalTeacher) {
        a.searchControl.setValue(originalTeacher.fullName || '', { emitEvent: false });
      } else {
        a.searchControl.setValue('', { emitEvent: false });
        a.teacherFullName = undefined;
        a.teacherEmail = undefined;
      }
      return a;
    });
    this.assignments.set([...resetAssignments]);
  }

  goBack(): void {
    this.router.navigate(['/app/classes', this.classId(), 'card']);
  }

  goToSchedule(): void {
    this.router.navigate(['/app/admin/classes', this.classId(), 'schedule']);
  }
}
