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
        path: 'subjects',
        loadComponent: () => import('./features/subjects/list/subjects-list.component').then(m => m.SubjectsListComponent)
      },
      {
        path: 'timetable',
        loadComponent: () => import('./features/timetable/list/timetable-list.component').then(m => m.TimetableListComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/list/attendance-list.component').then(m => m.AttendanceListComponent)
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
