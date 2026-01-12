## 2) Frontend таска — Dashboard Analytics UI

### Цель
В одном UI-скелете показать аналитику:
- для **STUDENT** — свою аналитику
- для **TEACHER/ADMIN** — аналитику по классам

Используем 3 уровня визуализации:
1) карточка-резюме
2) bar chart по топикам
3) drill-down внутрь топика

---

### 2.1 Студент: Dashboard

#### A) Карточка “Последний тест” (уровень 1)
Показывать:
- предмет/название теста + дата
- общий процент/балл
- сильные топики (зелёные)
- пробелы (красные)
- CTA: “Открыть детали”

Данные: `GET /api/student/analytics/last-attempt` → затем `.../summary`.

#### B) Bar chart по топикам (уровень 2)
Компонент:
- список топиков и проценты (столбики)
- сортировка по возрастанию процентов (самый слабый слева/сверху)
- кликабельность: клик по топику → drill-down

Данные: `GET /api/student/analytics/attempts/{attemptId}/topics`

#### C) Drill-down по топику (уровень 3)
Отдельная страница или drawer/modal:
- список вопросов топика
- отметка где ошибка
- показать выбранный ответ и правильный (если есть)
- explanation (если присутствует)

Данные: `GET /api/student/analytics/attempts/{attemptId}/topics/{topicId}`

---

### 2.2 Teacher/Admin: Analytics по классам

#### A) Экран списка классов
Компонент: таблица/карточки классов
- className
- кратко: “последний тест / средний %” (если дадим с бэка) или просто кнопка “Открыть”

Данные: `GET /api/teacher/analytics/classes`

#### B) Экран класса (детали)
Уровень 1: карточка-резюме по последнему тесту класса:
- avgPercent, medianPercent
- проблемные топики
- riskStudentsCount

Данные: `GET /api/teacher/analytics/classes/{classId}/last-test/summary`

Уровень 2: bar chart по топикам по конкретному testId
- avgPercent (можно рядом медиану)
- клик по топику → drill-down

Данные: `GET /api/teacher/analytics/classes/{classId}/tests/{testId}/topics`

Уровень 3: drill-down внутрь топика класса
- top worst questions
- (опц.) распределение вариантов
- (опц.) список учеников “risk”

Данные: `GET /api/teacher/analytics/classes/{classId}/tests/{testId}/topics/{topicId}`

---

### 2.3 UI/UX требования
- В student dashboard показываем “пробелы” и “сильные” человеческим текстом.
- Bar chart — основной визуальный элемент (donut не используем в MVP).
- Никаких studentId/classId “на глаз” — всё только из доступных списков/ролей.
- Обработать пустые состояния:
  - нет GRADED попыток → показать “Пока нет оцененных тестов”

---

## 3) Done Criteria (что считается готовым)
Backend:
- 3 student endpoints (last-attempt, summary, topics, drill-down) работают и защищены
- teacher/admin endpoints по классам работают
- агрегаты корректные, данные не “раздуваются” из-за multiple attempts

Frontend:
- Student dashboard показывает 3 уровня (карточка + bar chart + drill-down)
- Teacher/Admin workflow: классы → класс → топики → drill-down

---
