# Task (Frontend) — Admin UI: Curriculum + Teacher Assignments + Manual Schedule

Цель: сделать админские экраны, чтобы:
1) редактировать **норматив часов/нед** по уровням,
2) назначать **учителей на предметы** для конкретного класса,
3) вручную собирать **расписание** в сетке.

Эта задача рассчитана на отдельную сессию Claude для frontend.

---

## 0) Контракт (что ожидаем от backend)

### Curriculum API
- GET `/api/admin/curriculum/levels`
- GET `/api/admin/curriculum/levels/{classLevelId}/subjects`
- PUT `/api/admin/curriculum/levels/{classLevelId}/subjects`

### Assignments API
- GET `/api/admin/assignments/classes/{classId}`
- PUT `/api/admin/assignments/classes/{classId}`
- GET `/api/admin/assignments/teachers?q=...`

### Schedule API
- GET `/api/admin/schedule/classes/{classId}`
- PUT `/api/admin/schedule/classes/{classId}`
- POST `/api/admin/schedule/classes/{classId}/activate`

Ответы/DTO см. backend task (они должны совпасть).

---

## 1) Модели TypeScript

### 1.1 Curriculum
```ts
export interface CurriculumLevel {
  id: string;
  level: number;
  nameRu: string;
  nameKk: string;
}

export interface CurriculumSubjectItem {
  subjectId: string;
  nameRu: string;
  nameKk: string;
  nameEn: string;
  hoursPerWeek: number;
}

export interface CurriculumSubjectsResponse {
  classLevelId: string;
  subjects: CurriculumSubjectItem[];
}

export interface CurriculumUpdateRequest {
  items: { subjectId: string; hoursPerWeek: number }[];
}
```

### 1.2 Assignments
```ts
export interface TeacherShort {
  id: string;
  fullName: string;
  email: string;
}

export interface ClassAssignmentItem {
  subjectId: string;
  subjectNameRu: string;
  teacherId: string | null;
  teacherFullName?: string;
  teacherEmail?: string;
}

export interface ClassAssignmentsResponse {
  classId: string;
  classCode: string;
  items: ClassAssignmentItem[];
}

export interface ClassAssignmentsUpdateRequest {
  items: { subjectId: string; teacherId: string | null }[];
}
```

### 1.3 Schedule
```ts
export interface ScheduleCell {
  dayOfWeek: number;     // 1..daysPerWeek
  lessonNumber: number;  // 1..lessonsPerDay
  subjectId: string | null;
  subjectNameRu?: string;
  teacherId?: string | null;
  teacherFullName?: string;
}

export type ConflictType = 'TEACHER_BUSY' | 'HOURS_MISMATCH';

export interface ScheduleConflict {
  type: ConflictType;
  message: string;
  teacherId?: string;
  dayOfWeek?: number;
  lessonNumber?: number;
  subjectId?: string;
}

export interface ClassScheduleResponse {
  scheduleId: string;
  classId: string;
  status: 'DRAFT' | 'ACTIVE';
  daysPerWeek: number;
  lessonsPerDay: number;
  grid: ScheduleCell[];
  conflicts: ScheduleConflict[];
}

export interface SaveScheduleRequest {
  daysPerWeek: number;
  lessonsPerDay: number;
  grid: { dayOfWeek: number; lessonNumber: number; subjectId: string | null }[];
}
```

---

## 2) Services

Создать сервисы:
- `curriculum.service.ts`
- `assignments.service.ts`
- `schedule.service.ts`

Каждый — thin wrapper над HttpClient.

---

## 3) Страницы/компоненты (Admin)

### 3.1 Curriculum editor
Route: `/app/admin/curriculum`

UI:
- слева список уровней (1..11)
- справа таблица предметов уровня:
  - предмет
  - input number hours/week
- кнопка Save
- валидация: hours 0..12
- подсказка: сумма часов/нед (индикатор)

Поведение:
- при выборе уровня → загрузка subjects
- изменение hours → local state
- Save → PUT

---

### 3.2 Teacher assignments per class
Route: `/app/admin/classes/:classId/assignments`

UI:
- заголовок: `7A — назначения`
- таблица:
  - subject name
  - teacher select (autocomplete)
- Save → PUT

Особенности:
- Teacher select должен использовать `/teachers?q=`
- если teacherId null → показывать “Не назначен”
- подсветка строк, где teacher не назначен (warning)

---

### 3.3 Manual Schedule grid
Route: `/app/admin/classes/:classId/schedule`

UI:
- сетка: дни (колонки) × уроки (строки)
- каждая ячейка: select предмета
- справа/снизу панель конфликтов:
  - красные: TEACHER_BUSY
  - жёлтые: HOURS_MISMATCH

Поведение:
1) OnInit → GET schedule (backend сам создаст draft при отсутствии)
2) редактирование ячейки → меняем local state
3) Save → PUT schedule → обновляем grid + conflicts
4) Activate → POST activate (если conflicts критичные — показать confirm/disabled)

Доп. удобства (если успеете):
- копировать день (Пн → Вт)
- очистить день/урок
- hotkeys не нужно в MVP

---

## 4) Где брать список предметов для dropdown в расписании
Backend в `GET schedule` уже возвращает `grid` с names, но для выбора нужен справочник.

Простой вариант (MVP):
- использовать `GET assignments/classes/{classId}`:
  - там есть subjectId + subjectNameRu
  - это и будет список доступных предметов для данного класса

(В будущем можно сделать отдельный endpoint `/subjects?classId=`)

---

## 5) Ошибки и UX
- 401/403 → стандартный redirect/login
- 409 (если будет optimistic lock позже) → показать “данные устарели”
- 500 → snackbar “ошибка сохранения”

---

## 6) Acceptance Criteria
- Можно отредактировать hours/week и сохранить
- Можно назначить учителей и сохранить
- Можно заполнить расписание сеткой и сохранить
- Конфликты отображаются и обновляются после сохранения
- Activate переводит расписание в ACTIVE (если backend разрешает)

---

## 7) Out of scope
- авто-генерация расписания
- замены по датам
- кабинеты
