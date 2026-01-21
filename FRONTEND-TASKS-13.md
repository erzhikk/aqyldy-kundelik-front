# Frontend Task — Attendance MVP UI (checkboxes + “select all”, store who marked)

## Goal
Build MVP attendance UI:
- Any teacher can mark attendance (no “only my lessons” restriction).
- Pick class + date → show lessons list for that day.
- Open a lesson → show student list with checkboxes.
- Provide “Select all / All present” checkbox.
- Save via one PUT.
- Show “Marked by … at …” if attendance already exists.

---

## Backend contract assumptions
1) `GET /api/teacher/attendance/classes/{classId}/day?date=YYYY-MM-DD`
2) `GET /api/teacher/attendance/classes/{classId}/lesson?date=YYYY-MM-DD&lessonNumber=N`
3) `PUT /api/teacher/attendance/lessons/{lessonInstanceId}`

Lesson response includes:
- lessonInstanceId
- subject info
- students[] with `present:boolean`
- optional markedInfo

---

## 1) Pages / routes

### 1.1 Attendance entry page
Route suggestion:
- `/app/teacher/attendance`

UI:
- class selector (dropdown) + date picker (default today)
- lessons list (lessonNumber + subject name)
- marked badge if already marked

Click lesson → open marking page.

### 1.2 Attendance marking page
Route suggestion:
- `/app/teacher/attendance/classes/:classId/lessons/:lessonNumber?date=YYYY-MM-DD`

On init:
- call GET attendance lesson
- render header: class, subject, date, lessonNumber
- if markedInfo exists: show small line with who/when

Main:
- checkbox “Отметить всех (присутствуют)”
- list of students (name + checkbox)

Buttons:
- Save (enabled when dirty)
- Back

---

## 2) “Select all” behavior
- Checked → set present=true for all students
- Indeterminate if some present=false
- Unchecked when none present=true

Recommended: when user unchecks “select all”, do not force all absent; keep current per-student values.

---

## 3) Save flow
On Save:
- PUT with items[] {studentId, present}
- update UI state from response
- clear dirty
- snackbar “Сохранено”

Handle 400:
- show backend message (scheduleNotActive / lessonSlotEmpty)

---

## 4) Services / models
Create `attendance.service.ts`:
- getDayLessons(classId, date)
- getLessonAttendance(classId, date, lessonNumber)
- saveLessonAttendance(lessonInstanceId, items)

Create TS models matching backend DTO.

---

## Acceptance Criteria
- Teacher can pick class+date and see lessons list
- Can open lesson and mark attendance with checkboxes
- “Select all” works with indeterminate state
- Save persists; reopening shows markedInfo
- No restriction to “only my lessons”
