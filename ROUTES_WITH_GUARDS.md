# 🔐 Routes with Auth Guards

Примеры защиты маршрутов с помощью auth guards.

---

## 📝 Текущие маршруты (без защиты)

```typescript
// src/app/app.routes.ts
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
  },
  // ... другие маршруты
];
```

**Проблема:** Любой может зайти на `/dashboard` и `/users` без авторизации.

---

## ✅ Вариант 1: Защита отдельных маршрутов

Защитить только определённые страницы:

```typescript
import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // Защищённые маршруты
  {
    path: 'dashboard',
    canActivate: [authGuard], // ← Нужна авторизация
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'users',
    canActivate: [roleGuard(['ADMIN', 'SUPER_ADMIN'])], // ← Нужна роль
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
  },

  // Открытые маршруты (для тестов)
  {
    path: 'auth-test',
    loadComponent: () => import('./features/auth-test/auth-test.component').then(m => m.AuthTestComponent)
  },
  {
    path: 'acceptance',
    loadComponent: () => import('./features/auth-test/acceptance-test.component').then(m => m.AcceptanceTestComponent)
  }
];
```

---

## ✅ Вариант 2: Все маршруты внутри Shell

Более сложный вариант с layout/shell компонентом:

```typescript
import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth';

export const routes: Routes = [
  // Открытые маршруты
  {
    path: 'auth-test',
    loadComponent: () => import('./features/auth-test/auth-test.component').then(m => m.AuthTestComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },

  // Защищённый Shell (все дочерние маршруты автоматически защищены)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'users',
        canActivate: [roleGuard(['ADMIN', 'SUPER_ADMIN'])],
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'timetable',
        loadComponent: () => import('./features/timetable/timetable.component').then(m => m.TimetableComponent)
      }
    ]
  }
];
```

**Shell компонент** (layout с навигацией):

```typescript
// src/app/features/shell/shell.component.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="app-layout">
      <!-- Навигация -->
      <nav class="sidebar">
        <a routerLink="/dashboard">Dashboard</a>
        <a routerLink="/users">Users</a>
        <a routerLink="/timetable">Timetable</a>
      </nav>

      <!-- Контент -->
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class ShellComponent {}
```

---

## 🎯 Как работают guards

### authGuard (базовая проверка)

```typescript
authGuard: CanActivateFn = (route, state) => {
  const tokens = inject(TokenStorage);
  const router = inject(Router);

  // Есть токен и не истёк?
  if (tokens.access && !tokens.isAccessExpired()) {
    return true; // ✓ Пустить
  }

  // Нет токена → редирект на /auth-test
  return router.createUrlTree(['/auth-test'], {
    queryParams: { returnUrl: state.url } // Сохраняем куда хотел зайти
  });
};
```

**Пример:**
- Пользователь заходит на `/dashboard`
- authGuard проверяет токен
- Если токена нет → редирект на `/auth-test?returnUrl=/dashboard`
- После логина можно вернуться на `/dashboard`

---

### roleGuard (проверка роли)

```typescript
roleGuard(['ADMIN', 'SUPER_ADMIN']): CanActivateFn = (route, state) => {
  const tokens = inject(TokenStorage);
  const router = inject(Router);

  // Сначала проверяем авторизацию
  if (!tokens.access || tokens.isAccessExpired()) {
    return router.createUrlTree(['/auth-test']);
  }

  // Проверяем роли
  const userRoles = tokens.decode()?.roles ?? [];
  const hasRole = ['ADMIN', 'SUPER_ADMIN'].some(role => userRoles.includes(role));

  if (hasRole) {
    return true; // ✓ Пустить
  }

  // Нет нужной роли → редирект на dashboard
  return router.createUrlTree(['/dashboard']);
};
```

**Пример:**
- Учитель заходит на `/users`
- roleGuard проверяет роли
- У учителя нет ADMIN → редирект на `/dashboard`
- Админ может зайти на `/users` ✓

---

## 📋 Примеры использования

### Защита всех страниц кроме тестовых:

```typescript
export const routes: Routes = [
  // Тестовые страницы (открыты)
  { path: 'auth-test', loadComponent: ... },
  { path: 'acceptance', loadComponent: ... },

  // Все остальные (защищены)
  {
    path: '',
    canActivateChild: [authGuard], // ← Защищает все дочерние маршруты
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: ... },
      {
        path: 'users',
        canActivate: [roleGuard(['ADMIN', 'SUPER_ADMIN'])],
        loadComponent: ...
      }
    ]
  }
];
```

### Разные роли для разных страниц:

```typescript
{
  path: 'users',
  canActivate: [roleGuard(['ADMIN', 'SUPER_ADMIN'])],
  loadComponent: ...
},
{
  path: 'timetable',
  canActivate: [roleGuard(['ADMIN_SCHEDULE', 'SUPER_ADMIN'])],
  loadComponent: ...
},
{
  path: 'grades',
  canActivate: [roleGuard(['TEACHER', 'ADMIN', 'SUPER_ADMIN'])],
  loadComponent: ...
}
```

---

## 🔍 Тестирование Guards

### 1. Без токена:
```bash
# Очисти токены
sessionStorage.clear()
localStorage.clear()

# Попробуй зайти на /dashboard
# → Должен редиректнуть на /auth-test
```

### 2. С токеном, но без роли:
```bash
# Залогинься как TEACHER
# Попробуй зайти на /users
# → Должен редиректнуть на /dashboard
```

### 3. С правильной ролью:
```bash
# Залогинься как ADMIN
# Попробуй зайти на /users
# → Должен зайти успешно ✓
```

---

## 🎯 Рекомендации

### Для разработки:
**Вариант 1** - без guards на тестовых страницах:
- Легче тестировать
- Можно зайти без авторизации на `/acceptance`, `/auth-test`
- Защитить только критичные страницы (`/users`, `/timetable`)

### Для production:
**Вариант 2** - все внутри Shell с authGuard:
- Вся app защищена
- Единый layout/навигация
- Только `/login` и `/auth-test` открыты

---

## ✅ Что уже готово

Файлы созданы:
- ✅ `src/app/core/auth/auth.guard.ts` - Guard реализация
- ✅ Добавлен в barrel export `src/app/core/auth/index.ts`

Можно использовать:
```typescript
import { authGuard, roleGuard } from './core/auth';
```

---

## 📝 Следующие шаги

1. **Определись с архитектурой:**
   - Простая (защита отдельных маршрутов)
   - Сложная (Shell + дочерние маршруты)

2. **Обнови app.routes.ts:**
   - Добавь `canActivate: [authGuard]` где нужно
   - Добавь `roleGuard(['ROLE'])` для ролевой защиты

3. **Протестируй:**
   - Без токена → редирект
   - Без роли → редирект
   - С правильными данными → успех

---

**Пока маршруты открыты для удобства разработки.**
Когда будет готов production - добавь guards! 🔐
