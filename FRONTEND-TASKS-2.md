# Frontend Tasks: Topics CRUD inside Subject Edit Dialog (no separate menu)

Goal:
In Subjects list, user opens Subject edit dialog (acts as Subject card).
Inside the Subject edit dialog, show a Topics section:
- list topics for this subject
- show topic author fullName
- actions: create, edit, delete (delete blocked if topic has questions)

Constraints:
- NO separate sidebar menu for Topics
- Topics management is only accessible from Subject card (edit dialog).

Repo context:
- Subject list + dialogs already exist:
  - src/app/features/subjects/list/subjects-list.component.ts
  - src/app/features/subjects/edit/subject-edit.component.(ts/html/scss)
  - src/app/features/subjects/subjects.service.ts
- Routing has /app/subjects pointing to SubjectsListComponent (dialogs open from there).

Backend contract (to be implemented):
- GET    /api/assess/topics?subjectId={subjectId}&q={optional}
- POST   /api/assess/topics
- PUT    /api/assess/topics/{topicId}
- DELETE /api/assess/topics/{topicId}
  TopicDto fields:
- id, subjectId, name, description
- createdByFullName
- createdAt (optional)
- questionsCount (optional but recommended)

---

## 1) Add Topics API service

Create file:
- src/app/features/assess/topics/topics.service.ts
  (or put under subjects if you prefer, but keep API calls separated)

Implement methods:
- getTopics(subjectId: string, q?: string): Observable<TopicDto[]>
- createTopic(body: CreateTopicBody): Observable<TopicDto>
- updateTopic(id: string, body: UpdateTopicBody): Observable<TopicDto>
- deleteTopic(id: string): Observable<void>

Interfaces:
```ts
export interface TopicDto {
  id: string;
  subjectId: string;
  name: string;
  description?: string | null;
  createdByFullName?: string | null;
  createdAt?: string | null;
  questionsCount?: number | null;
}

export interface CreateTopicBody {
  subjectId: string;
  name: string;
  description?: string | null;
}

export interface UpdateTopicBody {
  name: string;
  description?: string | null;
}
```

Use HttpClient like other services.

---

## 2) Add Topic create/edit dialog component

Create standalone dialog component:
- src/app/features/subjects/topics/topic-dialog.component.ts
- src/app/features/subjects/topics/topic-dialog.component.html

Dialog modes:
- "create" (subjectId required)
- "edit" (topicId + initial values)

Form fields:
- name (required, min 2)
- description (optional)

Return value:
- on save: return created/updated TopicDto, or just boolean and refresh list.

Material imports:
- MatDialogModule
- MatFormFieldModule, MatInputModule
- MatButtonModule

---

## 3) Extend SubjectEditComponent to include Topics section

File:
- src/app/features/subjects/edit/subject-edit.component.ts/.html

Add state:
- topics: TopicDto[]
- topicsLoading: boolean
- topicsQuery: string (optional search)

On init:
- after loading form/classLevels, load topics:
  - topicsService.getTopics(data.id)

UI section (below the subject form) with:
- Header "Topics"
- Search input (optional)
- Button "+ Add topic"
- Table:
  columns: Name | Author | (optional Questions count) | Actions
  Actions: Edit, Delete

Display author:
- show topic.createdByFullName
- if null show '—'

Delete behavior:
- on click Delete -> confirm dialog (basic confirm is ok)
- call deleteTopic(topic.id)
- on success refresh topics list
- on error 409 show snackbar: "Cannot delete topic: it has questions"

If questionsCount is provided:
- you may disable Delete button when questionsCount > 0 (better UX)
- show tooltip "Has questions"

Note:
SubjectEditComponent currently is a dialog focused on subject fields.
Keep it usable: topics section can be collapsible or use a MatTabGroup:
- Tab 1: Subject
- Tab 2: Topics
  This avoids huge vertical scrolling.
  (Recommended implementation: MatTabGroup)

---

## 4) i18n keys

Add keys to i18n json (at least ru/en; project already uses ngx-translate).
Examples:
- SUBJECT.TOPICS.TITLE = "Topics"
- SUBJECT.TOPICS.ADD = "Add topic"
- SUBJECT.TOPICS.EDIT = "Edit"
- SUBJECT.TOPICS.DELETE = "Delete"
- SUBJECT.TOPICS.AUTHOR = "Author"
- SUBJECT.TOPICS.NAME = "Name"
- SUBJECT.TOPICS.DESCRIPTION = "Description"
- SUBJECT.TOPICS.DELETE_BLOCKED = "Cannot delete topic: it has questions"

Use existing i18n pattern in the app.

---

## 5) Wire-up and acceptance checks

Acceptance:
1) Open Subjects list -> click Edit on a subject -> dialog opens
2) In dialog, Topics tab/section shows list of topics for that subject
3) Each topic shows:
  - name
  - author fullName
4) Create topic:
  - open dialog -> save -> appears in list
5) Edit topic:
  - changes name -> list updates
6) Delete topic:
  - if no questions -> removed
  - if backend returns 409 -> show snackbar error; topic remains

---

## 6) Optional UX improvements (only if quick)

- Inline search by topic name (calls GET with q param)
- Show questionsCount column
- Disable Delete button when questionsCount > 0
- Sort topics alphabetically client-side if backend does not

---

## 7) Notes about existing code

- Subject edit is already a dialog used from SubjectsListComponent; do NOT create a new route/menu for topics.
- Keep Topics management strictly inside Subject edit "card" as requested.
