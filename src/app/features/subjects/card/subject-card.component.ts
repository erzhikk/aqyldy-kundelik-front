import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SubjectsService, SubjectDto } from '../subjects.service';
import { TopicsService, TopicDto } from '../topics/topics.service';
import { TopicDialogComponent, TopicDialogData } from '../topics/topic-dialog.component';

@Component({
  standalone: true,
  selector: 'app-subject-card',
  templateUrl: './subject-card.component.html',
  styleUrls: ['./subject-card.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule
  ]
})
export class SubjectCardComponent implements OnInit {
  private api = inject(SubjectsService);
  private topicsApi = inject(TopicsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  // Subject state
  private _subject = signal<SubjectDto | null>(null);
  subject = computed(() => this._subject());

  private _loading = signal(true);
  loading = computed(() => this._loading());

  private _error = signal<string | null>(null);
  error = computed(() => this._error());

  // Topics state
  topics: TopicDto[] = [];
  topicsLoading = false;
  topicsQuery = '';
  displayedColumns = ['name', 'author', 'questionsCount', 'actions'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSubject(id);
    } else {
      this._error.set('Subject ID is missing');
      this._loading.set(false);
    }
  }

  /**
   * Load subject from API
   */
  loadSubject(id: string): void {
    this._loading.set(true);
    this.api.getOne(id).subscribe({
      next: (subject) => {
        this._subject.set(subject);
        this._loading.set(false);
        this.loadTopics();
      },
      error: () => {
        this._error.set('Failed to load subject');
        this._loading.set(false);
      }
    });
  }

  /**
   * Navigate back to subjects list
   */
  goBack(): void {
    this.router.navigate(['/app/subjects']);
  }

  /**
   * Load topics for current subject
   */
  loadTopics(): void {
    const subjectData = this.subject();
    if (!subjectData) return;

    this.topicsLoading = true;
    this.topicsApi.getTopics(subjectData.id, this.topicsQuery || undefined).subscribe({
      next: (topics) => {
        this.topics = topics.sort((a, b) => a.name.localeCompare(b.name));
        this.topicsLoading = false;
      },
      error: () => {
        this.topicsLoading = false;
      }
    });
  }

  /**
   * Search topics by query
   */
  searchTopics(): void {
    this.loadTopics();
  }

  /**
   * Open dialog to create new topic
   */
  addTopic(): void {
    const subjectData = this.subject();
    if (!subjectData) return;

    const dialogData: TopicDialogData = {
      mode: 'create',
      subjectId: subjectData.id,
      subjectName: subjectData.nameRu
    };

    this.dialog.open(TopicDialogComponent, {
      width: '500px',
      data: dialogData
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadTopics();
      }
    });
  }

  /**
   * Open dialog to edit topic
   */
  editTopic(topic: TopicDto): void {
    const subjectData = this.subject();
    if (!subjectData) return;

    const dialogData: TopicDialogData = {
      mode: 'edit',
      subjectId: subjectData.id,
      subjectName: subjectData.nameRu,
      topic
    };

    this.dialog.open(TopicDialogComponent, {
      width: '500px',
      data: dialogData
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadTopics();
      }
    });
  }

  /**
   * Delete topic with confirmation
   */
  deleteTopic(topic: TopicDto): void {
    const message = this.translate.instant('SUBJECT.TOPICS.CONFIRM_DELETE', { name: topic.name });
    if (!confirm(message)) {
      return;
    }

    this.topicsApi.deleteTopic(topic.id).subscribe({
      next: () => {
        this.loadTopics();
        this.snackBar.open(
          this.translate.instant('SUBJECT.TOPICS.DELETE_SUCCESS'),
          this.translate.instant('COMMON.CLOSE'),
          { duration: 3000 }
        );
      },
      error: (err) => {
        if (err.status === 409) {
          this.snackBar.open(
            this.translate.instant('SUBJECT.TOPICS.DELETE_BLOCKED'),
            this.translate.instant('COMMON.CLOSE'),
            { duration: 5000 }
          );
        }
      }
    });
  }

  /**
   * Check if topic can be deleted
   */
  canDeleteTopic(topic: TopicDto): boolean {
    return !topic.questionsCount || topic.questionsCount === 0;
  }

  /**
   * Get tooltip for delete button
   */
  getDeleteTooltip(topic: TopicDto): string {
    return this.canDeleteTopic(topic)
      ? this.translate.instant('SUBJECT.TOPICS.DELETE')
      : this.translate.instant('SUBJECT.TOPICS.HAS_QUESTIONS');
  }

  /**
   * Navigate to topic details page
   */
  openTopic(topic: TopicDto): void {
    const subjectData = this.subject();
    if (!subjectData) return;

    this.router.navigate(['/app/subjects', subjectData.id, 'topics', topic.id]);
  }
}
