import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

/**
 * Lesson type from API
 */
type Lesson = {
  id: string;
  subjectId: string;
  groupId: string;
  roomId?: string | null;
  weekday: number;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
};

/**
 * Today's Lessons Widget
 *
 * Shows teacher's lessons for today
 * - Fetches from /api/timetable/teacher/{teacherId}/today
 * - Simple list with time, subject, group, room
 */
@Component({
  standalone: true,
  selector: 'app-today-lessons',
  imports: [CommonModule],
  template: `
    <div class="p-4 border rounded-2xl">
      <div class="font-semibold mb-2">Сегодня</div>

      @if (lessons.length > 0) {
        @for (l of lessons; track l.id) {
          <div class="py-2 border-b last:border-0">
            <div class="text-sm text-gray-500">{{ l.startTime }}–{{ l.endTime }}</div>
            <div class="font-medium">Subject {{ l.subjectId }} — Group {{ l.groupId }}</div>
            @if (l.roomId) {
              <div class="text-xs text-gray-500">Room {{ l.roomId }}</div>
            }
          </div>
        }
      } @else {
        <div class="text-gray-500 text-sm">Нет занятий на сегодня</div>
      }
    </div>
  `,
  styles: [`
    .p-4 {
      padding: 1rem;
    }

    .border {
      border: 1px solid #e5e7eb;
    }

    .rounded-2xl {
      border-radius: 1rem;
    }

    .font-semibold {
      font-weight: 600;
    }

    .mb-2 {
      margin-bottom: 0.5rem;
    }

    .py-2 {
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }

    .border-b {
      border-bottom: 1px solid #e5e7eb;
    }

    .last\\:border-0:last-child {
      border-bottom: 0;
    }

    .text-sm {
      font-size: 0.875rem;
    }

    .text-xs {
      font-size: 0.75rem;
    }

    .text-gray-500 {
      color: #6b7280;
    }

    .font-medium {
      font-weight: 500;
    }
  `]
})
export class TodayLessonsWidget implements OnInit {
  @Input({ required: true }) teacherId!: string;

  private http = inject(HttpClient);
  lessons: Lesson[] = [];

  ngOnInit(): void {
    this.load();
  }

  /**
   * Load today's lessons from API
   */
  load(): void {
    if (!this.teacherId) {
      console.warn('TodayLessonsWidget: teacherId is required');
      return;
    }

    // Get current weekday (0=Sunday, 1=Monday, etc.)
    const today = new Date().getDay();

    this.http
      .get<Lesson[]>(`/api/timetable/teacher/${this.teacherId}/today`)
      .subscribe({
        next: (lessons) => {
          // Filter by today's weekday and sort by start time
          this.lessons = lessons
            .filter(l => l.weekday === today)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        },
        error: (err) => {
          console.error('Failed to load today lessons:', err);
          // Keep empty array on error (will show "no lessons" message)
          this.lessons = [];
        }
      });
  }
}
