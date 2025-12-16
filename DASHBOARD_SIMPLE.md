# ✅ Dashboard - Упрощённая версия

Простой dashboard без Material Design, только Tailwind-like классы.

---

## 📁 Структура

```
src/app/features/dashboard/
├── dashboard.component.ts              # Контейнер
├── widgets/
│   ├── quick-actions.widget.ts        # Кнопки быстрых действий
│   └── today-lessons.widget.ts        # Занятия на сегодня (учителя)
└── index.ts
```

---

## 🎯 QuickActionsWidget

### Кнопки по ролям:

**ADMIN, SUPER_ADMIN:**
```html
<button class="bg-blue-600">+ Create user</button>
→ /users
```

**ADMIN_SCHEDULE, SUPER_ADMIN:**
```html
<button class="bg-indigo-600">+ Add lesson</button>
→ /timetable
```

**TEACHER, ADMIN, SUPER_ADMIN:**
```html
<button class="bg-emerald-600">+ Attendance sheet</button>
→ /attendance
```

### Код:
```typescript
can(...roles: string[]): boolean {
  const userRoles = this.tokens.decode()?.roles ?? [];
  return roles.some(role => userRoles.includes(role));
}

go(route: string): void {
  this.router.navigate([route]);
}
```

---

## 📅 TodayLessonsWidget

### Для учителей (TEACHER):

```
GET /api/timetable/teacher/{teacherId}/today
```

### Тип данных:
```typescript
type Lesson = {
  id: string;
  subjectId: string;  // "math-101"
  groupId: string;    // "10-A"
  roomId?: string | null; // "205"
  weekday: number;    // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string;  // "09:00"
  endTime: string;    // "10:30"
};
```

### Отображение:
```
Сегодня

09:00–10:30
Subject math-101 — Group 10-A
Room 205

11:00–12:30
Subject physics-202 — Group 11-B
```

### Пустое состояние:
```
Нет занятий на сегодня
```

### Логика:
- Фильтрует по текущему weekday
- Сортирует по startTime
- Если ошибка API → показывает пустое состояние

---

## 🚀 Использование

### 1. Запустить
```bash
npm start
# → http://localhost:4200 (redirect → /dashboard)
```

### 2. Тест ADMIN
Login: `admin@local` / `admin123`

**Видит:**
- ✅ + Create user
- ✅ + Attendance sheet
- ❌ Today's Lessons (not a teacher)

### 3. Тест TEACHER
Создай пользователя с ролью TEACHER

**Видит:**
- ✅ + Attendance sheet
- ✅ Today's Lessons widget (если API работает)

### 4. Тест ADMIN_SCHEDULE
**Видит:**
- ✅ + Add lesson

---

## 📊 Backend API

### Необходимый endpoint:
```
GET /api/timetable/teacher/{teacherId}/today

Returns: Lesson[]
```

### Пример ответа:
```json
[
  {
    "id": "uuid-1",
    "subjectId": "math-101",
    "groupId": "10-A",
    "roomId": "205",
    "weekday": 1,
    "startTime": "09:00",
    "endTime": "10:30"
  },
  {
    "id": "uuid-2",
    "subjectId": "physics-202",
    "groupId": "11-B",
    "roomId": null,
    "weekday": 1,
    "startTime": "11:00",
    "endTime": "12:30"
  }
]
```

### Если API не готово:
- Widget покажет: "Нет занятий на сегодня"
- Ошибка в console.log, но не падает

---

## ✅ Что работает автоматически

### HTTP Interceptors:
1. **Loading** - spinner во время запросов
2. **Auth** - Bearer token автоматически
3. **Error** - уведомления об ошибках

### Token Storage:
- `can(...roles)` проверяет роли из JWT
- `userName()` берёт fullName из токена
- `uid()` берёт sub (user ID) из токена

---

## 🎨 Стили

Все стили inline (Tailwind-like классы):
- `p-4` = padding: 1rem
- `border` = border: 1px solid #e5e7eb
- `rounded-2xl` = border-radius: 1rem
- `bg-blue-600` = background: #2563eb
- `text-gray-500` = color: #6b7280
- `font-semibold` = font-weight: 600

**Нет зависимостей от Material Design!**

---

## 🔍 Проверка

### QuickActions:
```bash
# Console:
# Проверь роли
const token = sessionStorage.getItem('aq_access');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload.roles);
```

### TodayLessons:
```bash
# Network tab:
GET /api/timetable/teacher/{id}/today
# Должен быть Bearer token в headers
```

---

## 📝 Troubleshooting

### Кнопка не показывается
➡️ Проверь роли в токене

### Занятия пустые
➡️ Проверь:
1. Backend endpoint существует?
2. Возвращает правильный формат?
3. weekday соответствует сегодняшнему дню?

### Навигация даёт 404
➡️ Нормально! Страницы `/timetable` и `/attendance` ещё не созданы

---

## 🎯 Следующие шаги

1. Создать страницу `/timetable` (расписание)
2. Создать страницу `/attendance` (посещаемость)
3. Добавить backend endpoint для today's lessons
4. Добавить больше виджетов на dashboard

---

**Status: ✅ READY**

Dashboard работает без Material Design!
Простые кнопки + простой список.
Все через Tailwind-like утилиты.
