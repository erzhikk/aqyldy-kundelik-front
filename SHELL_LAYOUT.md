# ✅ Shell Layout - Setup Complete

Main application layout with Material Design navigation.

---

## 📁 Files Created

```
src/app/layout/
├── shell.component.ts          # Shell component with navigation
└── shell.component.html        # Shell template

src/app/features/
├── subjects/subjects.component.ts        # Placeholder
├── timetable/timetable.component.ts      # Placeholder
├── attendance/attendance.component.ts    # Placeholder
└── auth/login.component.ts               # Placeholder login

src/app/app.routes.ts            # Updated with Shell layout
```

---

## 🎯 Features

### ✅ Shell Component

**Layout:**
- Material sidenav (collapsible sidebar)
- Top toolbar with logo, user name, logout
- Global loading indicator (progress bar)
- Responsive design

**Navigation Menu:**
- Dashboard (all users)
- Users (ADMIN, SUPER_ADMIN)
- Subjects (all users)
- Timetable (ADMIN_SCHEDULE, SUPER_ADMIN)
- Attendance (TEACHER, ADMIN, SUPER_ADMIN)

**Features:**
- Role-based menu visibility
- Active link highlighting
- Sidenav toggle button
- User display name from JWT token
- Logout functionality

---

## 🗺️ Route Structure

### Main App (with Shell layout):
```
/ → ShellComponent
  ├── '' → DashboardComponent
  ├── users → UsersComponent
  ├── subjects → SubjectsComponent (placeholder)
  ├── timetable → TimetableComponent (placeholder)
  └── attendance → AttendanceComponent (placeholder)
```

### Testing Pages (no Shell):
```
/acceptance → AcceptanceTestComponent
/auth-test → AuthTestComponent
/notify-demo → NotifyDemoComponent
/interceptor-test → InterceptorTestComponent
```

### Auth Pages (no Shell):
```
/login → LoginComponent (placeholder)
```

---

## 🎨 UI/UX

### Sidebar:
- Width: 16rem (256px)
- App title: "Aqyldy"
- Material icons for each menu item
- Active link: Blue background (#eff6ff)
- Hover: Light gray background

### Toolbar:
- Material primary color
- Sticky top (always visible)
- Menu toggle button (hamburger)
- App title: "Aqyldy Kundelik"
- User display name
- Logout button with icon

### Loading Indicator:
- Material progress bar
- Shows at top of page
- Connected to LoadingService
- Automatic via interceptor

---

## 🔒 Role-Based Menu

### Visibility Logic:

```typescript
canShow(item: MenuItem): boolean {
  if (!item.roles?.length) return true; // No roles = visible to all
  const userRoles = this.roles();
  return item.roles.some(role => userRoles.includes(role));
}
```

### Menu Items:

| Menu Item | Icon | Roles | Visible To |
|-----------|------|-------|------------|
| Dashboard | dashboard | - | All users |
| Users | group | ADMIN, SUPER_ADMIN | Admins only |
| Subjects | menu_book | - | All users |
| Timetable | event | ADMIN_SCHEDULE, SUPER_ADMIN | Schedule admins |
| Attendance | check_circle | TEACHER, ADMIN, SUPER_ADMIN | Teachers & admins |

---

## 🚀 Usage

### Start Application:

```bash
npm start
# → http://localhost:4200
```

### Navigation:
1. Login via `/auth-test`
2. Automatically redirects to `/` (Dashboard)
3. See Shell layout with sidebar and toolbar
4. Menu items filtered by user role

---

## 📊 Testing by Role

### TEACHER:
```
Visible menu items:
✓ Dashboard
✓ Subjects
✓ Attendance

Hidden:
✗ Users
✗ Timetable
```

### ADMIN:
```
Visible:
✓ Dashboard
✓ Users
✓ Subjects
✓ Attendance

Hidden:
✗ Timetable (unless also ADMIN_SCHEDULE)
```

### ADMIN_SCHEDULE:
```
Visible:
✓ Dashboard
✓ Subjects
✓ Timetable

Hidden:
✗ Users
✗ Attendance
```

### SUPER_ADMIN:
```
Visible (ALL):
✓ Dashboard
✓ Users
✓ Subjects
✓ Timetable
✓ Attendance
```

---

## 🎯 Features

### User Display Name:
```typescript
displayName(): string {
  const payload = this.tokens.decode() as any;
  return payload?.fullName ?? payload?.email ?? payload?.sub ?? 'User';
}
```

Shows in order:
1. fullName (if exists)
2. email (fallback)
3. sub/user ID (fallback)
4. "User" (last resort)

### Logout:
```typescript
logout(): void {
  sessionStorage.clear();
  localStorage.clear();
  location.href = '/login';
}
```

- Clears all tokens
- Redirects to /login page
- Can add API call to `/api/auth/logout` if needed

### Sidenav Toggle:
```typescript
toggleSidenav(): void {
  this.sidenavOpened.set(!this.sidenavOpened());
}
```

- Desktop: Open by default
- Mobile: Can be toggled via hamburger button
- State managed by signal

---

## 📱 Responsive Design

### Desktop (>768px):
- Sidenav always visible (side mode)
- Full width sidebar (16rem)
- Toolbar with full user info

### Mobile (<768px):
- Sidenav can be toggled
- Hamburger menu button
- Compact toolbar
- Full-screen content when sidenav closed

---

## 🐛 Troubleshooting

### Menu items not showing:
**Check user roles:**
```javascript
const token = sessionStorage.getItem('aq_access');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('User roles:', payload.roles);
```

### Loading bar not showing:
**Check LoadingService:**
- Using `LoadingService` (not `LoaderService` typo)
- Injected correctly in shell.component.ts
- Connected to interceptor

### Sidenav not working:
**Check Material modules:**
- MatSidenavModule imported
- Angular Material installed
- No console errors

### Active link not highlighting:
**Check routing:**
- `routerLinkActive="active"` set
- CSS for `.active` class exists
- Navigation working correctly

---

## 🎨 Customization

### Change Sidebar Width:
```css
.w-64 {
  width: 20rem; /* Change from 16rem */
}
```

### Change Active Color:
```css
::ng-deep .mat-mdc-list-item.active {
  background-color: #fef3c7 !important; /* Yellow */
  color: #f59e0b !important;
}
```

### Add More Menu Items:
```typescript
menu: MenuItem[] = [
  // ... existing items
  {
    path: 'reports',
    label: 'Reports',
    icon: 'assessment',
    roles: ['ADMIN', 'SUPER_ADMIN']
  }
];
```

---

## 🔐 Add Auth Guard (Optional)

Protect Shell routes with auth guard:

```typescript
// app.routes.ts
import { authGuard } from './core/auth';

{
  path: '',
  loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
  canActivate: [authGuard], // ← Add guard
  children: [
    // ... children routes
  ]
}
```

Now unauthenticated users will be redirected to `/auth-test`.

---

## ✅ Verification Checklist

Shell is ready if:

- [x] Shell component created
- [x] Template with sidenav + toolbar
- [x] Routes updated with Shell layout
- [x] Placeholder components created
- [x] Role-based menu filtering works
- [x] Active link highlighting works
- [x] Loading bar shows during requests
- [x] User name displays in toolbar
- [x] Logout clears tokens
- [x] Sidenav toggle works
- [x] Responsive design implemented

---

## 📚 Next Steps

### 1. Create Real Pages:
Replace placeholders:
- SubjectsComponent → Full CRUD
- TimetableComponent → Schedule management
- AttendanceComponent → Attendance tracking

### 2. Add Auth Guard:
```typescript
canActivate: [authGuard]
```

### 3. Add Role Guards:
```typescript
{
  path: 'users',
  canActivate: [roleGuard(['ADMIN', 'SUPER_ADMIN'])],
  loadComponent: ...
}
```

### 4. Improve Logout:
```typescript
logout(): void {
  this.authService.logout().subscribe(() => {
    sessionStorage.clear();
    localStorage.clear();
    this.router.navigate(['/login']);
  });
}
```

---

## 🎉 Status: READY

Shell layout is complete and functional!

**Main Features:**
- ✅ Material Design sidenav + toolbar
- ✅ Role-based menu filtering
- ✅ Global loading indicator
- ✅ Responsive layout
- ✅ User info display
- ✅ Logout functionality

Navigate to http://localhost:4200 and see the Shell in action! 🚀
