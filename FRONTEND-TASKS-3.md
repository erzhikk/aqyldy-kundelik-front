## Navigation rule (must follow)

- User can access Topics list ONLY from Subject card.
- Subject card opens ONLY by clicking the Subject name (link) in SubjectsList table.
- No separate sidebar/menu item, no standalone Topics route.

Implementation detail:
- In SubjectsListComponent table, render subject.name as clickable link/button.
- On click, open SubjectEditComponent dialog (acts as Subject card).
- Topics section/tab is inside SubjectEditComponent only.

##  Acceptance:
1) Open Subjects list -> click on a subject NAME (link) -> Subject dialog/card opens
2) In dialog, Topics tab/section shows list of topics for that subject
   ...
