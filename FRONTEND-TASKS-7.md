# Aqyldy Kundelik — AI Coach (Frontend tasks)

Цель: добавить в UI ученика 2 фичи:
1) **ИИ‑план** по слабым темам для конкретной попытки (attempt)
2) **ИИ‑помощь по топику** в drill‑down (attempt + topic)

Backend даёт:
- `POST /api/student/ai/plan`
- `POST /api/student/ai/attempts/{attemptId}/topics/{topicId}/help`

Ответ единый: `AiGeneratedDto` (см. backend‑таску).

---

## 0) Где в проекте встраиваем
Маршруты уже есть:
- `/app/analytics/attempt/:attemptId` → `AttemptDetailsComponent`
- `/app/analytics/attempt/:attemptId/topic/:topicId` → `TopicDrilldownComponent`

Фронт уже использует `AnalyticsService` в:
- `features/assess/analytics/analytics.service.ts`
- student analytics components

Мы добавим **отдельный** сервис для AI, чтобы не смешивать аналитику и генерацию.

---

## 1) Создать AI service + модели

### 1.1 Файл сервиса
Создать:
`src/app/features/assess/analytics/ai-coach.service.ts`

Интерфейсы:
```ts
export interface AiGeneratedDto {
  type: 'PLAN' | 'TOPIC_HELP';
  attemptId?: string;
  topicId?: string;
  content: string;
  cached: boolean;
  createdAt: string;
}

export interface AiPlanRequestDto {
  attemptId: string;
  language?: string; // 'ru'|'kk'|'en'
}

export interface AiTopicHelpRequestDto {
  language?: string;
  mode?: 'coach' | 'short' | 'practice';
}
```

Методы:
- `generatePlan(req: AiPlanRequestDto): Observable<AiGeneratedDto>`
- `generateTopicHelp(attemptId: string, topicId: string, req?: AiTopicHelpRequestDto): Observable<AiGeneratedDto>`

URL:
- `${environment.apiUrl}/student/ai/plan`
- `${environment.apiUrl}/student/ai/attempts/${attemptId}/topics/${topicId}/help`

---

## 2) UI: AI‑Plan на странице Attempt Details

### 2.1 Компонент “AI Coach Card”
Создать standalone component:

`src/app/features/assess/analytics/student/ai-plan-card.component.ts`

Вход:
- `@Input() attemptId!: string`

Состояния:
- loading
- error
- result (AiGeneratedDto | null)

UI:
- Карточка (MatCard)
- Заголовок: “ИИ‑коуч” / “План по слабым темам”
- Кнопка: “Сгенерировать план”
- Плашка `cached`: если `cached=true`, показать “из кеша”
- Отображение `content` в читаемом виде:
  - простая разметка: заменить `\n` → `<br>` (или `pre`)
  - НЕ использовать innerHTML без санации, лучше `<pre class="ai-text">{{content}}</pre>`

Ошибки:
- если 429: показать “Лимит на сегодня исчерпан”
- прочие: “Не удалось получить ответ”

### 2.2 Встроить в `AttemptDetailsComponent`
Файл:
`src/app/features/assess/analytics/student/attempt-details.component.ts`

- импортировать `AiPlanCardComponent`
- в template вставить карточку **над** графиком топиков:

```html
<div class="details-content">
  <app-ai-plan-card [attemptId]="attemptId()"></app-ai-plan-card>
  <app-topics-chart [attemptId]="attemptId()"></app-topics-chart>
</div>
```

---

## 3) UI: AI‑Topic Help в drill‑down

### 3.1 Компонент “AI Topic Help Card”
Создать:
`src/app/features/assess/analytics/student/ai-topic-help-card.component.ts`

Inputs:
- `attemptId: string`
- `topicId: string`
- опционально `topicName?: string` (если уже есть в родителе)

UI:
- Заголовок: “Разбор ошибок по теме”
- Кнопки:
  - “Объясни” (mode=coach)
  - “Коротко” (mode=short)
  - “Дай тренажёр” (mode=practice)
- Результат: `<pre>`
- cached badge

### 3.2 Встроить в `TopicDrilldownComponent`
Файл:
`src/app/features/assess/analytics/student/topic-drilldown.component.ts`

- импортировать `AiTopicHelpCardComponent`
- вставить блок **вверху страницы**, до списка вопросов/таблиц (чтобы сразу было видно)

---

## 4) i18n (минимум)
Добавить ключи в файлы переводов (если используете):
- `ANALYTICS.AI_TITLE`
- `ANALYTICS.AI_PLAN_BUTTON`
- `ANALYTICS.AI_TOPIC_HELP_TITLE`
- `ANALYTICS.AI_LIMIT_REACHED`
- `ANALYTICS.AI_CACHED_HINT`

(Если i18n сейчас не везде — допускается текстом по‑русски на первом шаге, но лучше сразу ключами.)

---

## 5) UX: важные детали
- Кнопки дизейблить при loading
- Сохранять последний полученный ответ в state компонента (signal)
- При смене route params (attempt/topic) — сбрасывать состояние

---

## 6) Acceptance Criteria

### Attempt Details
- На `/app/analytics/attempt/:attemptId` отображается карточка AI‑плана
- Нажатие “Сгенерировать план” вызывает backend endpoint и показывает текст
- При повторном нажатии (в пределах кеша) показывается `cached=true`

### Topic Drilldown
- На `/app/analytics/attempt/:attemptId/topic/:topicId` отображается карточка AI‑помощи
- Есть 3 режима (coach/short/practice) → разные запросы
- Ошибка 429 отображается понятным сообщением

---

## 7) Техдолг/следующий шаг (не в эту таску, но заложить)
- Markdown rendering (например, marked) — только если очень нужно
- “Сохранить в заметки” / “Скачать план”
- У учителя: AI‑комментарий по слабым темам класса (потом)

---
