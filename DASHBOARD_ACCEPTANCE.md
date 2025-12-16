# ✅ Dashboard - Acceptance Testing

Быстрая проверка Dashboard по ролям.

---

## 🚀 Подготовка

### 1. Запустить backend
```bash
cd ../aqyldy-kundelik-backend
npm start
# → http://localhost:8080
```

### 2. Запустить frontend
```bash
npm start
# → http://localhost:4200 (auto redirect → /dashboard)
```

---

## 🧪 Тест 1: TEACHER (Учитель)

### Шаги:
1. Перейти на `/auth-test`
2. Создать/залогиниться под пользователем с ролью `TEACHER`
3. Перейти на `/dashboard` (или просто `/`)

### ✅ Ожидаемый результат:

**Quick Actions:**
- ✅ Видна кнопка: **+ Attendance sheet** (зелёная/emerald)
- ❌ НЕ видна: Create user
- ❌ НЕ видна: Add lesson

**Today's Lessons Widget:**
- ✅ Виден блок **"Сегодня"**
- ✅ Если есть уроки → показывает до 5 ближайших по времени
- ✅ Если уроков нет → **"Нет занятий на сегодня"**
- ✅ Каждый урок показывает:
  - Время: `09:00–10:30`
  - Subject и Group: `Subject math-101 — Group 10-A`
  - Room (если есть): `Room 205`

**Interceptors:**
- ✅ При загрузке уроков → loading spinner (верхний)
- ✅ Если API ошибка → snackbar notification (красный)

---

## 🧪 Тест 2: ADMIN_SCHEDULE (Админ расписания)

### Шаги:
1. Logout текущего пользователя
2. Залогиниться под `ADMIN_SCHEDULE`
3. Перейти на `/dashboard`

### ✅ Ожидаемый результат:

**Quick Actions:**
- ✅ Видна кнопка: **+ Add lesson** (фиолетовая/indigo)
- ❌ НЕ видна: Create user
- ❌ НЕ видна: Attendance sheet

**Today's Lessons Widget:**
- ❌ НЕ виден блок "Сегодня" (только для TEACHER)

**Placeholder widgets:**
- ✅ Виден placeholder "Stats / Alerts"
- ✅ Виден placeholder "Schedule Overview"

---

## 🧪 Тест 3: ADMIN (Администратор)

### Шаги:
1. Logout
2. Залогиниться под `admin@local` / `admin123`
3. Перейти на `/dashboard`

### ✅ Ожидаемый результат:

**Quick Actions:**
- ✅ Видна кнопка: **+ Create user** (синяя/blue)
- ✅ Видна кнопка: **+ Attendance sheet** (зелёная)
- ❌ НЕ видна: Add lesson (если нет роли ADMIN_SCHEDULE)

**Today's Lessons Widget:**
- ✅ Виден, если у ADMIN есть роль TEACHER
- ❌ НЕ виден, если ADMIN только администратор (не преподаёт)

---

## 🧪 Тест 4: SUPER_ADMIN (Суперадмин)

### Шаги:
1. Logout
2. Залогиниться под `SUPER_ADMIN`
3. Перейти на `/dashboard`

### ✅ Ожидаемый результат:

**Quick Actions:**
- ✅ Видна кнопка: **+ Create user** (синяя)
- ✅ Видна кнопка: **+ Add lesson** (фиолетовая)
- ✅ Видна кнопка: **+ Attendance sheet** (зелёная)

**Все 3 кнопки должны быть видны!**

---

## 🧪 Тест 5: Today's Lessons (с данными)

### Предварительно:
Нужен backend endpoint, который возвращает уроки:

```
GET /api/timetable/teacher/{teacherId}/today

Response:
[
  {
    "id": "lesson-1",
    "subjectId": "math-101",
    "groupId": "10-A",
    "roomId": "205",
    "weekday": 1,
    "startTime": "09:00",
    "endTime": "10:30"
  },
  {
    "id": "lesson-2",
    "subjectId": "physics-202",
    "groupId": "11-B",
    "roomId": null,
    "weekday": 1,
    "startTime": "11:00",
    "endTime": "12:30"
  }
]
```

### Шаги:
1. Залогиниться как TEACHER
2. Перейти на `/dashboard`
3. Открыть DevTools → Network

### ✅ Ожидаемый результат:

**Network Tab:**
```
GET /api/timetable/teacher/{userId}/today
Request Headers:
  Authorization: Bearer eyJhbGc...
Response: 200 OK
[...lessons array...]
```

**UI:**
- ✅ Loading spinner показался и исчез
- ✅ Уроки отфильтрованы по weekday (текущий день недели)
- ✅ Уроки отсортированы по startTime
- ✅ Показываются первые 5 уроков (если больше)
- ✅ Каждый урок в формате:
  ```
  09:00–10:30
  Subject math-101 — Group 10-A
  Room 205
  ```

---

## 🧪 Тест 6: Today's Lessons (ошибка API)

### Шаги:
1. Залогиниться как TEACHER
2. Убедиться что backend **НЕ** реализует endpoint `/api/timetable/teacher/{id}/today`
3. Перейти на `/dashboard`

### ✅ Ожидаемый результат:

**Network Tab:**
```
GET /api/timetable/teacher/{userId}/today
Response: 404 Not Found
```

**UI:**
- ✅ Loading spinner показался и исчез
- ✅ НЕ показывается красный snackbar (ошибка обрабатывается тихо)
- ✅ Показывается: **"Нет занятий на сегодня"**

**Console:**
```
Failed to load today lessons: HttpErrorResponse {status: 404, ...}
```

---

## 🧪 Тест 7: Interceptors

### Loading Interceptor

**Проверка:**
1. Залогиниться как TEACHER
2. Перейти на `/dashboard`
3. Смотреть на верхний правый угол

**Ожидается:**
- ✅ Spinner появляется во время запроса уроков
- ✅ Spinner исчезает после завершения

### Error Interceptor

**Проверка:**
1. Остановить backend
2. Обновить страницу `/dashboard`

**Ожидается:**
- ✅ Красный snackbar внизу экрана
- ✅ Сообщение: "Network error. Please check your connection."
- ✅ Auto-dismiss через несколько секунд

### Auth Interceptor

**Проверка:**
1. Залогиниться
2. Открыть DevTools → Network
3. Перейти на `/dashboard`
4. Проверить запрос уроков

**Ожидается:**
```
GET /api/timetable/teacher/{id}/today
Request Headers:
  Authorization: Bearer eyJhbGc...  ← Токен добавлен автоматически
```

---

## 🧪 Тест 8: Навигация кнопок

### Create User (ADMIN)
**Шаги:**
1. Залогиниться как ADMIN
2. Кликнуть **+ Create user**

**Ожидается:**
- ✅ Переход на `/users`
- ✅ Открывается страница управления пользователями

### Add Lesson (ADMIN_SCHEDULE)
**Шаги:**
1. Залогиниться как ADMIN_SCHEDULE
2. Кликнуть **+ Add lesson**

**Ожидается:**
- ✅ Переход на `/timetable`
- ⚠️ Может быть 404 если страница не создана (это нормально)

### Attendance Sheet (TEACHER)
**Шаги:**
1. Залогиниться как TEACHER
2. Кликнуть **+ Attendance sheet**

**Ожидается:**
- ✅ Переход на `/attendance`
- ⚠️ Может быть 404 если страница не создана (это нормально)

---

## 🧪 Тест 9: Responsive Design

### Desktop (широкий экран)
**Проверка:**
- ✅ Quick Actions на всю ширину (full width)
- ✅ Today's Lessons и Placeholder в 2 колонки

### Mobile (узкий экран)
**Проверка:**
1. Открыть DevTools → Toggle device toolbar
2. Выбрать iPhone/Android

**Ожидается:**
- ✅ Все виджеты в 1 колонку
- ✅ Кнопки Quick Actions переносятся (flex-wrap)
- ✅ Всё читаемо и кликабельно

---

## 📊 Acceptance Criteria Summary

### ✅ Quick Actions Widget
- [x] Показывает разные кнопки для разных ролей
- [x] ADMIN → Create user
- [x] ADMIN_SCHEDULE → Add lesson
- [x] TEACHER → Attendance sheet
- [x] SUPER_ADMIN → Все 3 кнопки
- [x] Hover эффекты работают
- [x] Навигация работает

### ✅ Today's Lessons Widget
- [x] Виден только для TEACHER
- [x] Загружает данные с API
- [x] Фильтрует по weekday
- [x] Сортирует по времени
- [x] Показывает до 5 уроков
- [x] Пустое состояние если нет уроков
- [x] Ошибки обрабатываются тихо (нет snackbar)

### ✅ Interceptors Integration
- [x] Loading spinner показывается
- [x] Auth token добавляется автоматически
- [x] Ошибки сети показывают snackbar
- [x] 404 не показывает snackbar (handled in widget)

### ✅ UI/UX
- [x] Responsive layout работает
- [x] Dashboard отображается как главная страница
- [x] Welcome header с именем пользователя
- [x] Placeholder widgets для будущих фич

---

## 🐛 Troubleshooting

### Кнопки не показываются
**Проблема:** Роли в токене неправильные

**Решение:**
```javascript
// Browser console
const token = sessionStorage.getItem('aq_access');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Roles:', payload.roles);
```

### Today's Lessons всегда пустой
**Проблема:** weekday не совпадает

**Решение:**
```javascript
// Check current weekday
console.log('Today is weekday:', new Date().getDay());
// 0=Sunday, 1=Monday, 2=Tuesday, etc.

// Make sure backend returns lessons with matching weekday
```

### Spinner не исчезает
**Проблема:** Loading interceptor не работает

**Решение:**
```typescript
// Force hide
inject(LoadingService).forceHide();
```

---

## 📝 Test Report Template

```
✅ DASHBOARD ACCEPTANCE TEST

Date: [DATE]
Tester: [NAME]
Backend: ✓ Running / ✗ Not running

Test Results:
[ ] Test 1: TEACHER role - PASS/FAIL
[ ] Test 2: ADMIN_SCHEDULE role - PASS/FAIL
[ ] Test 3: ADMIN role - PASS/FAIL
[ ] Test 4: SUPER_ADMIN role - PASS/FAIL
[ ] Test 5: Today's Lessons (with data) - PASS/FAIL
[ ] Test 6: Today's Lessons (API error) - PASS/FAIL
[ ] Test 7: Interceptors - PASS/FAIL
[ ] Test 8: Navigation - PASS/FAIL
[ ] Test 9: Responsive - PASS/FAIL

Issues Found:
- [List any issues]

Notes:
- Backend endpoint /api/timetable/teacher/{id}/today: IMPLEMENTED / NOT IMPLEMENTED
- All interceptors working: YES / NO
- [Additional observations]

Status: APPROVED / NEEDS FIXES
```

---

## 🔗 Related Docs

- **DASHBOARD_SIMPLE.md** - Краткое описание (RU)
- **DASHBOARD_SETUP.md** - Полная документация
- **ACCEPTANCE_CHECKLIST.md** - Тесты интерсепторов

---

**Quick Start:**
```bash
npm start
# Login as admin@local / admin123
# Go to http://localhost:4200
# Test different roles!
```

🎯 **Главное что проверить:**
1. ✅ Разные кнопки для разных ролей
2. ✅ Today's Lessons только для TEACHER
3. ✅ Loading spinner работает
4. ✅ Навигация работает
