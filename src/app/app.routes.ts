import { Routes } from '@angular/router';

export const routes: Routes = [
  // Root: Login page
  {
    path: '',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },

  // Main app under /app with Shell layout
  {
    path: 'app',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    // Add authGuard here if needed: canActivate: [authGuard]
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./features/users/list/users-list.component').then(m => m.UsersListComponent)
      },
      {
        path: 'students/:id/card',
        loadComponent: () => import('./features/users/card/student-card.component').then(m => m.StudentCardComponent)
      },
      {
        path: 'staff',
        loadComponent: () => import('./features/users/list/users-list.component').then(m => m.UsersListComponent)
      },
      {
        path: 'staff/:id/card',
        loadComponent: () => import('./features/users/card/staff-card.component').then(m => m.StaffCardComponent)
      },
      {
        path: 'classes',
        loadComponent: () => import('./features/classes/list/classes-list.component').then(m => m.ClassesListComponent)
      },
      {
        path: 'classes/:id/card',
        loadComponent: () => import('./features/classes/card/class-card.component').then(m => m.ClassCardComponent)
      },
      {
        path: 'subjects',
        loadComponent: () => import('./features/subjects/list/subjects-list.component').then(m => m.SubjectsListComponent)
      },
      {
        path: 'subjects/:id/card',
        loadComponent: () => import('./features/subjects/card/subject-card.component').then(m => m.SubjectCardComponent)
      },
      {
        path: 'subjects/:subjectId/topics/:topicId',
        loadComponent: () => import('./features/assess/topics/details/topic-details.component').then(m => m.TopicDetailsComponent)
      },
      {
        path: 'testing',
        loadComponent: () => import('./features/assess/student-tests/student-tests-list.component').then(m => m.StudentTestsListComponent)
      },
      {
        path: 'timetable',
        loadComponent: () => import('./features/timetable/list/timetable-list.component').then(m => m.TimetableListComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/list/attendance-list.component').then(m => m.AttendanceListComponent)
      },
      {
        path: 'assess/tests',
        loadComponent: () => import('./features/assess/tests/list/tests-list.component').then(m => m.TestsListComponent)
      },
      {
        path: 'assess/tests/new',
        loadComponent: () => import('./features/assess/tests/form/test-form.component').then(m => m.TestFormComponent)
      },
      {
        path: 'assess/tests/:id/card',
        loadComponent: () => import('./features/assess/tests/card/test-card.component').then(m => m.TestCardComponent)
      },
      {
        path: 'assess/tests/:id/edit',
        loadComponent: () => import('./features/assess/tests/form/test-form.component').then(m => m.TestFormComponent)
      },
      {
        path: 'assess/tests/:id/composition',
        loadComponent: () => import('./features/assess/tests/composition/test-composition.component').then(m => m.TestCompositionComponent)
      },
      {
        path: 'tests/:id/start',
        loadComponent: () => import('./features/assess/taking/test-taking.component').then(m => m.TestTakingComponent)
      },
      {
        path: 'attempts/:attemptId/result',
        loadComponent: () => import('./features/assess/taking/test-result.component').then(m => m.TestResultComponent)
      },
      // Analytics routes
      {
        path: 'analytics',
        loadComponent: () => import('./features/assess/analytics/student/student-analytics.component').then(m => m.StudentAnalyticsComponent)
      },
      {
        path: 'analytics/attempt/:attemptId',
        loadComponent: () => import('./features/assess/analytics/student/attempt-details.component').then(m => m.AttemptDetailsComponent)
      },
      {
        path: 'analytics/attempt/:attemptId/topic/:topicId',
        loadComponent: () => import('./features/assess/analytics/student/topic-drilldown.component').then(m => m.TopicDrilldownComponent)
      },
      {
        path: 'analytics/classes',
        loadComponent: () => import('./features/assess/analytics/teacher/teacher-classes-list.component').then(m => m.TeacherClassesListComponent)
      },
      {
        path: 'analytics/classes/:classId',
        loadComponent: () => import('./features/assess/analytics/teacher/class-analytics.component').then(m => m.ClassAnalyticsComponent)
      },
      {
        path: 'analytics/classes/:classId/test/:testId/topic/:topicId',
        loadComponent: () => import('./features/assess/analytics/teacher/class-topic-drilldown.component').then(m => m.ClassTopicDrilldownComponent)
      },
      // Admin routes
      {
        path: 'admin/curriculum',
        loadComponent: () => import('./features/admin/curriculum/curriculum-editor.component').then(m => m.CurriculumEditorComponent)
      },
      {
        path: 'admin/classes/:classId/assignments',
        loadComponent: () => import('./features/admin/assignments/class-assignments.component').then(m => m.ClassAssignmentsComponent)
      },
      {
        path: 'admin/classes/:classId/schedule',
        loadComponent: () => import('./features/admin/schedule/class-schedule.component').then(m => m.ClassScheduleComponent)
      }
    ]
  },

  // Testing pages (outside Shell layout)
  {
    path: 'acceptance',
    loadComponent: () => import('./features/auth-test/acceptance-test.component').then(m => m.AcceptanceTestComponent)
  },
  {
    path: 'auth-test',
    loadComponent: () => import('./features/auth-test/auth-test.component').then(m => m.AuthTestComponent)
  },
  {
    path: 'notify-demo',
    loadComponent: () => import('./features/auth-test/notify-demo.component').then(m => m.NotifyDemoComponent)
  },
  {
    path: 'interceptor-test',
    loadComponent: () => import('./features/auth-test/interceptor-test.component').then(m => m.InterceptorTestComponent)
  },

  // Fallback redirect to login
  {
    path: '**',
    redirectTo: ''
  }
];
