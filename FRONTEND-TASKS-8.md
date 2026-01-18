# Aqyldy Kundelik — AI Coach v2 (Frontend, JSON UX)

Цель: использовать **структурированный JSON** от AI и рендерить
нормальные карточки (а не текст в `<pre>`).

---

## 1) Модели (строго по контракту)

### 1.1 PLAN
```ts
export interface AiPlanResponse {
  weakTopics: {
    topicId: string;
    topicName: string;
    accuracy: number;
    mainMistake: string;
  }[];

  weeklyPlan: {
    day: number;
    focus: string;
    actions: string[];
    timeMinutes: number;
  }[];

  rules: string[];

  selfCheck: {
    question: string;
    answer: string;
  }[];
}
```

### 1.2 TOPIC_HELP
```ts
export interface AiTopicHelpResponse {
  topic: {
    topicId: string;
    topicName: string;
  };
  mainError: string;
  explanation: string;
  examples: {
    question: string;
    solution: string;
  }[];
  practice: {
    question: string;
    answer: string;
  }[];
}
```

---

## 2) Обновить AI service

Файл:
`ai-coach.service.ts`

Методы:
```ts
generatePlan(req: AiPlanRequestDto)
  : Observable<AiPlanResponse>;

generateTopicHelp(
  attemptId: string,
  topicId: string,
  req?: AiTopicHelpRequestDto
): Observable<AiTopicHelpResponse>;
```

⚠️ Больше **никаких string‑ответов**.

---

## 3) UI: AI Plan Card

### Отрисовка
- Weak topics → таблица
- Weekly plan → список дней (accordion)
- Rules → bullet list
- Self check → Q/A карточки

### UX
- показывать `accuracy` цветом (red <50, yellow 50–70)
- если `cached=true` → бейдж “из кеша”

---

## 4) UI: Topic Help Card

### Блоки
1. Заголовок темы
2. Main error (warning box)
3. Explanation
4. Examples (Q → Solution)
5. Practice (вопросы + кнопка “показать ответ”)

---

## 5) Ошибки
- 429 → snackbar “Лимит на сегодня исчерпан”
- 500 → “Не удалось получить помощь от ИИ”

---

## 6) Acceptance Criteria
- UI не содержит парсинга текста
- Все данные типизированы
- Можно легко изменить дизайн без трогания бэка
- При смене схемы бэк просто поднимает `schema=v2`

---

## 7) Результат
Фронт получает:
- чистые DTO
- предсказуемый UX
- основу для будущих фич (teacher AI, class insights)

---
