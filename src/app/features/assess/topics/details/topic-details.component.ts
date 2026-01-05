import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SubjectsService, SubjectDto } from '../../../subjects/subjects.service';
import { TopicsService as SubjectTopicsService, TopicDto } from '../../../subjects/topics/topics.service';
import { QuestionsService, QuestionDto } from '../../questions/questions.service';
import { QuestionCreateDialogComponent } from '../../questions/create/question-create-dialog.component';
import { QuestionEditDialogComponent } from '../../questions/edit/question-edit-dialog.component';
import { QuestionViewDialogComponent } from '../../questions/view/question-view-dialog.component';

@Component({
  standalone: true,
  selector: 'app-topic-details',
  templateUrl: './topic-details.component.html',
  styleUrls: ['./topic-details.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    TranslateModule
  ]
})
export class TopicDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private subjectsApi = inject(SubjectsService);
  private topicsApi = inject(SubjectTopicsService);
  private questionsApi = inject(QuestionsService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  subjectId = '';
  topicId = '';

  private _subject = signal<SubjectDto | null>(null);
  subject = computed(() => this._subject());

  private _topic = signal<TopicDto | null>(null);
  topic = computed(() => this._topic());

  private _loading = signal(true);
  loading = computed(() => this._loading());

  private _error = signal<string | null>(null);
  error = computed(() => this._error());

  private _questions = signal<QuestionDto[]>([]);
  questions = computed(() => this._questions());

  dataSource = new MatTableDataSource<QuestionDto>([]);

  private _questionsLoading = signal(false);
  questionsLoading = computed(() => this._questionsLoading());

  private _totalElements = signal(0);
  totalElements = computed(() => this._totalElements());

  pageIndex = 0;
  pageSize = 10;

  displayedColumns = ['question', 'actions'];

  ngOnInit(): void {
    const subjectId = this.route.snapshot.paramMap.get('subjectId');
    const topicId = this.route.snapshot.paramMap.get('topicId');

    if (!subjectId || !topicId) {
      this._error.set('Missing subject or topic id.');
      this._loading.set(false);
      return;
    }

    this.subjectId = subjectId;
    this.topicId = topicId;

    this.loadSubject();
    this.loadTopic();
    this.loadQuestions();
  }

  private loadSubject(): void {
    this.subjectsApi.getOne(this.subjectId).subscribe({
      next: (subject) => {
        this._subject.set(subject);
      }
    });
  }

  private loadTopic(): void {
    this._loading.set(true);
    this.topicsApi.getTopic(this.topicId).subscribe({
      next: (topic) => {
        this._topic.set(topic);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('Failed to load topic.');
        this._loading.set(false);
      }
    });
  }

  loadQuestions(): void {
    this._questionsLoading.set(true);
    this.questionsApi.list({
      topicId: this.topicId,
      page: this.pageIndex,
      size: this.pageSize
    }).subscribe({
      next: (response) => {
        // Проверяем, является ли response объектом с полем content или массивом
        const questions = Array.isArray(response) ? response : (response.content || []);
        this._questions.set(questions);
        this.dataSource.data = questions;
        // Если response - массив, то totalElements = длина массива
        this._totalElements.set(Array.isArray(response) ? response.length : (response.totalElements || 0));
        this._questionsLoading.set(false);
      },
      error: () => {
        this._questionsLoading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadQuestions();
  }

  viewQuestion(question: QuestionDto): void {
    this.dialog.open(QuestionViewDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { question }
    });
  }

  openCreateQuestion(): void {
    const topic = this.topic();
    if (!topic) return;

    this.dialog.open(QuestionCreateDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: {
        topicId: this.topicId,
        topicName: topic.name
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.pageIndex = 0;
        this.loadQuestions();
      }
    });
  }

  openEditQuestion(question: QuestionDto): void {
    const topic = this.topic();
    if (!topic) return;

    this.dialog.open(QuestionEditDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: {
        question,
        topicName: topic.name
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadQuestions();
      }
    });
  }

  deleteQuestion(question: QuestionDto): void {
    const message = this.translate.instant('QUESTION.CONFIRM_DELETE');
    const confirmed = confirm(message);
    if (!confirmed) return;

    this.questionsApi.delete(question.id).subscribe({
      next: () => {
        this.loadQuestions();
      }
    });
  }
}
