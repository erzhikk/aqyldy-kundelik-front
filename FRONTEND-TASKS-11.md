# Frontend Task — Days per week (5/6) on Curriculum screen

## Goal
On `/app/admin/curriculum`, add an editable control **Days per week (5/6)** for the selected class level. Save it to backend (`class_level.days_per_week`) and load it back on refresh.

No schedule UI changes in this task. Only the curriculum page.

---

## Dependencies / Expected backend contract
Frontend expects backend to provide:

1) Levels list:
- `GET /api/admin/curriculum/levels`
- Each item includes `daysPerWeek` (5 or 6)

2) Level subjects:
- `GET /api/admin/curriculum/levels/{classLevelId}/subjects`
- Preferred: response includes `daysPerWeek` as well
- If not included, FE will take `daysPerWeek` from the selected item in levels list

3) Save endpoint:
- `PUT /api/admin/curriculum/levels/{classLevelId}/subjects`
- Accepts optional `daysPerWeek` plus the existing hours/week payload

---

## UI changes
### Placement
In the right-side panel of the Curriculum page (above the subjects table), add a small block:

- Title/label: “Параметры недели” (or similar)
- Field: “Дней в неделю”
- Control: Select with options **5** and **6**

### Behavior
- When a level is selected, the control shows the current `daysPerWeek`.
- Changing the value marks the form as “dirty” (same as editing hours/week).
- Save button becomes enabled when either:
  - any hours/week changed, or
  - `daysPerWeek` changed.

### Error UX
- If backend rejects (400), show a snackbar/alert like:
  - “Дней в неделю должно быть 5 или 6”

---

## Data flow / State
- Keep `daysPerWeek` in the same local state object as the selected level’s curriculum data.
- On save, include `daysPerWeek` in the payload (alongside hours/week items).
- After successful save, refresh the local state from the response and clear “dirty”.

---

## Acceptance Criteria
- Curriculum page shows “Days per week” selector for the selected level
- User can switch 5 ↔ 6 and save
- After refresh/reopen, the saved value is shown
- Save button reacts correctly to changes in this field
