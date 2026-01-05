# Frontend Tasks: Subjects -> Topic -> Questions/Answers table + Breadcrumbs

Target UX:
- Menu: "Subjects" (existing)
- Subjects list: table, subject name is clickable link -> navigates to Subject Card page.
- Subject Card page: subject info + Topics table.
  - Topic name is clickable link -> navigates to Topic Card page.
- Topic Card page:
  - Topic info (name/desc)
  - Questions table with two-level display:
    - main row: Question text
    - expanded or nested row: its 4–5 answers with ✅/❌ indicator.
- Breadcrumbs on Topic Card: "Subject / Topic"
  - Optional; keep easy to remove later.

Repo note:
Use existing Angular structure and Material components already used in the project.

---

## 1) Routing

Add/ensure routes:

1) Subjects list (already)
- /app/subjects -> SubjectsListComponent

2) Subject card page
- /app/subjects/:subjectId -> SubjectDetailsComponent (create if missing)
  - This is a page navigation via link from subjects list.
  - If you currently use SubjectEdit dialog, keep it for editing, but create this page for card view + topics list.

3) Topic card page
- /app/subjects/:subjectId/topics/:topicId -> TopicDetailsComponent

Route data for breadcrumbs:
- subjectId and topicId in params; label fetched from API.

---

## 2) API services

Create/extend services:

### SubjectsApiService
- getSubject(subjectId): Observable<SubjectDto>

### TopicsApiService
- getTopicsBySubject(subjectId, q?): Observable<TopicListItemDto[]>
- getTopic(topicId): Observable<TopicDetailsDto>
- createTopic(subjectId, body)
- updateTopic(topicId, body)
- deleteTopic(topicId)

### QuestionsApiService
- getQuestionsByTopic(topicId, params): Observable<Page<QuestionWithAnswersDto>> (or list)
- createQuestion(topicId, body)
- updateQuestion(questionId, body)
- deleteQuestion(questionId)

DTO interfaces:
- TopicListItemDto includes createdByFullName.
- QuestionWithAnswersDto contains answers: AnswerDto[] with isCorrect.

---

## 3) SubjectsList: subject name as link

In subjects-list table:
- Render subject.name as clickable element.
- On click: router.navigate(['/app/subjects', subject.id])

Keep any existing edit button as separate action if needed, but primary navigation = name link.

Acceptance:
- Clicking the subject name opens Subject Card page.

---

## 4) Subject Card page: SubjectDetailsComponent

Create component:
- src/app/features/subjects/details/subject-details.component.ts/html

UI:
- Header: subject name, description (if any), actions (optional edit)
- Topics section:
  - table columns: Name (link), Author (fullName), (optional Questions count), Actions (edit/delete)
  - Add Topic button -> opens TopicDialogComponent (modal)
  - Edit Topic -> same dialog
  - Delete Topic -> confirm; if 409 show snackbar "Topic has questions"

Topic link navigation:
- Click topic name -> router.navigate(['/app/subjects', subjectId, 'topics', topicId])

Data loading:
- subject$ = subjectsApi.getSubject(subjectId)
- topics$ = topicsApi.getTopicsBySubject(subjectId)

---

## 5) Topic Card page: TopicDetailsComponent

Create component:
- src/app/features/assess/topics/details/topic-details.component.ts/html

UI layout:
- Breadcrumbs (Subject / Topic) on top
- Topic header card: topic name, description, createdByFullName (optional)
- Questions table (two-level)

Data:
- Fetch subject name for breadcrumbs:
  - Option A: getSubject(subjectId) from route param
  - Option B: getTopic(topicId) returns subjectName; use that
- Fetch topic details: topicsApi.getTopic(topicId)
- Fetch questions list: questionsApi.getQuestionsByTopic(topicId, {page,size,search})

---

## 6) Two-level Questions+Answers table (Material)

Preferred implementation: MatTable with expandable rows (detail row).

Row 1 (question row):
- Question text (truncate with tooltip)
- Actions: Edit / Delete (optional for now)
- Expand button (chevron) to show answers

Row 2 (detail row):
- Render answers list:
  - each line: ✅/❌ + answer text
  - keep orderIndex order
- If you want "4/5 answers" visible without expand, show count in question row.

Implementation tips:
- Use multiTemplateDataRows
- Add `expandedElement` state
- Use `@angular/animations` for expand/collapse (optional)

---

## 7) Optional: Question Create/Edit UI (phase next)
For now, just list questions+answers.

Next (not mandatory in this ticket):
- Add "New Question" button on Topic card
- CreateQuestionDialog:
  - question text + 4/5 answer inputs, radio for correct (single choice)

But if you want MVP full flow, implement create dialog too.

---

## 8) Breadcrumbs component

Create lightweight component:
- src/app/shared/breadcrumbs/breadcrumbs.component.ts/html

Inputs:
- crumbs: Array<{ label: string; link?: any[] }>

On TopicDetails:
- crumbs = [
  { label: subjectName, link: ['/app/subjects', subjectId] },
  { label: topicName }
  ]

Make it removable:
- wrap in one component and place it only on TopicDetails page.

---

## 9) Acceptance checklist

1) Subjects list:
- subject name is a link and navigates to Subject card page.

2) Subject card page:
- shows subject info
- shows topics list for the subject
- topics show createdByFullName column
- clicking topic name navigates to Topic card page.

3) Topic card page:
- breadcrumbs show "Subject / Topic"
- topic info visible
- questions table loads and shows questions
- expand question row shows 4–5 answers with ✅/❌ markers.

4) Delete topic:
- if backend returns 409 -> show snackbar error.

---

## 10) Notes
- Do NOT add separate sidebar menu item for Topics.
- Navigation chain is strictly: Subjects list -> Subject card -> Topic card.
- Keep breadcrumbs optional and easy to remove later.
