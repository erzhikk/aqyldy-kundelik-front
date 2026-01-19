# Frontend Task — Activation UX: block on conflicts, show PLAN_EXCEEDS_SLOTS, remove “activate anyway”

## Goal
Update schedule UI so that:
- The schedule can be saved as DRAFT anytime.
- Activation to ACTIVE is **blocked** if backend reports critical conflicts:
  - `PLAN_EXCEEDS_SLOTS`
  - `TEACHER_BUSY`
  - `INVALID_SLOT_RANGE` (if backend sends)
- Remove/disable the current “Activate anyway” confirmation path.
- Show clear UI warnings/errors on the schedule screen.

This task is for the frontend Claude session.

---

## Backend contract assumptions
Activation endpoint:
- `POST /api/admin/schedule/classes/{classId}/activate`
- If activation is blocked, backend returns **409** with a response body that includes:
  - `conflicts: ScheduleConflict[]`
  - other schedule fields (same as GET schedule)

Schedule endpoints (GET/PUT) also return conflicts including `PLAN_EXCEEDS_SLOTS`.

---

## 1) Conflict UI requirements
### 1.1 Display conflicts panel
On schedule screen, display a list/panel of conflicts.
Group by severity if possible:

**Critical (block activation)**
- `PLAN_EXCEEDS_SLOTS`
- `TEACHER_BUSY`
- `INVALID_SLOT_RANGE`

**Warnings**
- e.g., `HOURS_MISMATCH`

If severity is not provided, treat the above types as critical on FE.

### 1.2 Messaging
For `PLAN_EXCEEDS_SLOTS`, show message like:
- "План не помещается в неделю. Увеличьте дни/уроки или уменьшите часы."

For `TEACHER_BUSY`, show message from backend and optionally highlight cell if day/lesson provided.

---

## 2) Activation button behavior
### 2.1 Disable activation when critical conflicts exist
- If conflicts contain any critical types → disable “Activate” button.
- Tooltip or helper text explaining why activation is unavailable.

### 2.2 Handle activation request
When user clicks Activate:
- call activate API
- if 200: update UI state to ACTIVE (badge)
- if 409: show conflicts from response, keep status DRAFT, do not show confirm

### 2.3 Remove “Activate anyway”
- Delete/disable any confirm dialog that tries to force activation despite conflicts.
- If you still want a confirm in the future, it must be backed by a backend “force” flag — but that is out of scope now.

---

## 3) Schedule policy source of truth
Backend may return `daysPerWeek` and `lessonsPerDay` derived from `class_level`.
Frontend should treat returned values as authoritative:
- Build grid using `daysPerWeek` and `lessonsPerDay` from response.
- Do not assume always 5 days.
- When saving schedule (PUT), you may still send them if current contract requires, but UI must re-render from backend response.

---

## 4) Acceptance Criteria
- If schedule has `PLAN_EXCEEDS_SLOTS`, user sees it on schedule page
- Activate button is disabled when critical conflicts exist
- Activation request returning 409 updates conflicts on screen; no “activate anyway”
- When conflicts are resolved, activation succeeds and status becomes ACTIVE
