# 🧪 Users Feature - Acceptance Test

Quick acceptance test for the Users feature with CRUD operations and role-based permissions.

---

## 🚀 Prerequisites

### 1. Start Backend
```bash
cd ../aqyldy-kundelik-backend
npm start
# → Backend running on http://localhost:8080
```

### 2. Start Frontend
```bash
npm start
# → Opens http://localhost:4200
```

### 3. Verify Backend Seeder
Make sure your backend has seeded the `admin@local` user:
- Email: `admin@local`
- Password: `admin123`
- Role: `ADMIN` or `SUPER_ADMIN`

---

## ✅ Test 1: Login as Admin

**Action:**
1. Navigate to http://localhost:4200/auth-test
2. Enter credentials:
   - Email: `admin@local`
   - Password: `admin123`
3. Click **Login**

**Expected:**
- ✓ Green notification: "Login successful"
- ✓ Auth Status shows: Access Token ✓, Refresh Token ✓
- ✓ User info displays with admin role
- ✓ Tokens saved in browser storage

**Verify:**
```javascript
// In browser console:
sessionStorage.getItem('aq_access')  // Should show JWT token
localStorage.getItem('aq_refresh')   // Should show refresh token
```

---

## ✅ Test 2: View Users List

**Action:**
1. Navigate to http://localhost:4200/users
2. Wait for table to load

**Expected:**
- ✓ Loading spinner shows during request
- ✓ Table displays with columns: Full Name, Email, Role, Status
- ✓ At least 1 user visible (admin@local)
- ✓ **"Create User" button is visible** (because you're logged in as admin)
- ✓ Role badges styled (blue background)
- ✓ Status badges colored (green/red/orange depending on status)

**Watch Network Tab:**
```
GET /api/users
Request Headers:
  Authorization: Bearer eyJhbGc...
Response: 200 OK
[
  {
    "id": "...",
    "tenantId": "...",
    "email": "admin@local",
    "fullName": "Admin User",
    "role": "ADMIN",
    "status": "ACTIVE"
  }
]
```

---

## ✅ Test 3: Get TenantID for New User

**Action:**
1. Open browser DevTools → Network tab
2. Look at the response from `GET /api/users`
3. Copy the `tenantId` from any existing user
4. Keep this ID ready for Test 4

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",  ← Copy this
  "email": "admin@local",
  ...
}
```

---

## ✅ Test 4: Create New User (Success Path)

**Action:**
1. Click **"Create User"** button
2. Fill in the form:
   - **Email**: `teacher1@test.com`
   - **Full Name**: `Test Teacher`
   - **Role**: `TEACHER` (select from dropdown)
   - **Password**: `password123`
   - **Tenant ID**: `[paste the ID from Test 3]`
   - **School ID**: _(leave empty or enter a UUID)_
3. Click **Create**

**Expected:**
- ✓ Loading spinner shows
- ✓ Button text changes: "Create" → "Creating..."
- ✓ Button disabled during submission
- ✓ POST request sent to `/api/users`
- ✓ Response: **201 Created**
- ✓ Dialog closes automatically
- ✓ Green notification: "User created successfully!" (if you add NotifyService)
- ✓ **Table refreshes automatically**
- ✓ New user appears in the table

**Watch Network Tab:**
```
POST /api/users
Request Headers:
  Authorization: Bearer eyJhbGc...
  Content-Type: application/json
Request Body:
{
  "email": "teacher1@test.com",
  "fullName": "Test Teacher",
  "role": "TEACHER",
  "password": "password123",
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "schoolId": null
}
Response: 201 Created
{
  "id": "...",
  "tenantId": "...",
  "email": "teacher1@test.com",
  "fullName": "Test Teacher",
  "role": "TEACHER",
  "status": "ACTIVE"
}

GET /api/users  (automatic refresh)
Response: 200 OK
[... list now includes new user ...]
```

---

## ✅ Test 5: Create User Validation

**Action:**
1. Click **"Create User"** button again
2. Try to submit with **empty fields**

**Expected:**
- ✓ Create button **disabled** until form is valid
- ✓ Material error messages appear:
  - "Valid email is required"
  - "Name must be at least 2 characters"
  - "Role is required"
  - "Password must be at least 6 characters"
  - "Tenant ID is required"

**Action:**
3. Enter invalid email: `notanemail`
4. Enter short password: `123`
5. Try to submit

**Expected:**
- ✓ Form validation prevents submission
- ✓ Error messages displayed
- ✓ Create button remains disabled

---

## ✅ Test 6: Create User Error Handling

**Action:**
1. Click **"Create User"**
2. Fill form with **duplicate email** (e.g., `admin@local`)
3. Click **Create**

**Expected:**
- ✓ Loading spinner shows
- ✓ POST request sent
- ✓ Response: **400 Bad Request** or **409 Conflict**
- ✓ **Red error notification** appears automatically (via error interceptor)
- ✓ Message: "Email already exists" or similar backend error
- ✓ Dialog stays open (user can fix and retry)
- ✓ Button re-enabled

**Watch Network Tab:**
```
POST /api/users
Response: 400 Bad Request
{
  "message": "Email already exists",
  "error": "Bad Request"
}
```

---

## ✅ Test 7: Permission Check (Non-Admin User)

**Prerequisites:**
1. Create a non-admin user (e.g., `TEACHER` role)
2. Logout from admin account
3. Login as the teacher

**Action:**
1. Navigate to http://localhost:4200/users

**Expected:**
- ✓ Table loads and displays users
- ✓ **"Create User" button is HIDDEN** (not just disabled)
- ✓ Only users with `ADMIN` or `SUPER_ADMIN` roles see the button

**Verify in Code:**
```typescript
// users.component.ts
canCreate(): boolean {
  const roles = this.tokens.decode()?.roles ?? [];
  return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
}
```

---

## ✅ Test 8: Interceptors Working

**Verify all 3 interceptors are active:**

### Loading Interceptor
- ✓ Spinner appears when loading users list
- ✓ Spinner appears when creating user
- ✓ Spinner disappears after completion

### Auth Interceptor
- ✓ All requests include `Authorization: Bearer ...` header
- ✓ If token expires (test with invalid token), auto-refresh happens
- ✓ Requests retry after token refresh

### Error Interceptor
- ✓ 400/409 errors show red notifications
- ✓ 404 errors show "Resource not found"
- ✓ 500 errors show "Server error"
- ✓ Network errors show "Network error"

**Console Logs:**
```
[Loading Interceptor] Request count: 1
[Auth Interceptor] Adding Bearer token
[Loading Interceptor] Request count: 0
✓ Request completed
```

---

## ✅ Test 9: Auto-Refresh on 401

**Action:**
1. While logged in, open browser console
2. Manually invalidate access token:
   ```javascript
   sessionStorage.setItem('aq_access', 'invalid_token');
   ```
3. Navigate to http://localhost:4200/users (or refresh page)

**Expected:**
- ✓ GET request sent with invalid token → 401
- ✓ Auth interceptor detects 401
- ✓ POST `/api/auth/refresh` called automatically
- ✓ New access token saved
- ✓ GET `/api/users` retried with new token → 200 OK
- ✓ Table displays successfully
- ✓ **No error notification shown** (auth interceptor handles silently)

**Watch Network Tab:**
```
1. GET /api/users → 401 Unauthorized
2. POST /api/auth/refresh → 200 OK  (automatic!)
3. GET /api/users → 200 OK          (retry with new token)
```

---

## ✅ Test 10: Dialog Cancel

**Action:**
1. Click **"Create User"**
2. Start filling the form
3. Click **Cancel** button

**Expected:**
- ✓ Dialog closes
- ✓ No API request made
- ✓ Table remains unchanged
- ✓ No errors or notifications

---

## 📊 Acceptance Criteria Summary

### ✅ Users List Component
- [x] Displays table with users from API
- [x] Shows 4 columns: Full Name, Email, Role, Status
- [x] Styled badges for roles and statuses
- [x] Empty state when no users
- [x] Loading spinner during API calls
- [x] Auto-refresh after creating user

### ✅ Create User Dialog
- [x] Material form with 6 fields
- [x] Full validation with error messages
- [x] Dropdown with 7 role options
- [x] Loading state during submission
- [x] Auto-closes on success
- [x] Error handling via error interceptor

### ✅ Permissions
- [x] Create button visible only for ADMIN/SUPER_ADMIN
- [x] Non-admin users cannot see create button
- [x] Permission check uses JWT token roles

### ✅ Integration
- [x] All 3 interceptors work together
- [x] Loading spinner on all requests
- [x] Bearer token added automatically
- [x] Errors show notifications
- [x] Auto-refresh on 401
- [x] Form data sent correctly
- [x] Response data handled correctly

---

## 🐛 Common Issues

### Issue: "Create User" button not visible
**Check:**
1. Are you logged in? Check `sessionStorage.aq_access`
2. Does your user have ADMIN or SUPER_ADMIN role?
   ```javascript
   // Decode token to check roles
   const token = sessionStorage.getItem('aq_access');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log(payload.roles); // Should include 'ADMIN'
   ```

### Issue: Material styles not working
**Solution:**
```typescript
// Check app.config.ts includes animations
provideAnimations()
```

### Issue: Form validation not working
**Check:**
- ReactiveFormsModule imported
- Validators set correctly
- Material form field modules imported

### Issue: Table empty but users exist
**Check Network Tab:**
- Is GET /api/users returning data?
- Check response format matches UserDto interface
- Look for console errors

### Issue: Create request returns 401
**Check:**
- Access token exists and valid
- Auth interceptor adding Bearer token
- Backend endpoint requires authentication

---

## 🎯 Success Criteria

**All tests pass if:**

✓ Admin user can view users list
✓ Admin user can create new users
✓ Form validation works correctly
✓ Errors show notifications
✓ Non-admin users cannot create users
✓ Auto-refresh works on 401
✓ Loading spinner shows during requests
✓ Table updates after creating user

**You're ready for production! 🎉**

---

## 📝 Test Report Template

```
✅ USERS FEATURE ACCEPTANCE TEST

Date: [DATE]
Tester: [NAME]
Backend: ✓ Running / ✗ Not running
Frontend: ✓ Running / ✗ Not running

Test Results:
[ ] Test 1: Login as Admin - PASS/FAIL
[ ] Test 2: View Users List - PASS/FAIL
[ ] Test 3: Get TenantID - PASS/FAIL
[ ] Test 4: Create New User (Success) - PASS/FAIL
[ ] Test 5: Create User Validation - PASS/FAIL
[ ] Test 6: Create User Error Handling - PASS/FAIL
[ ] Test 7: Permission Check - PASS/FAIL
[ ] Test 8: Interceptors Working - PASS/FAIL
[ ] Test 9: Auto-Refresh on 401 - PASS/FAIL
[ ] Test 10: Dialog Cancel - PASS/FAIL

Issues Found:
- [List any issues]

Notes:
- [Additional observations]

Status: APPROVED / NEEDS FIXES
```

---

## 🔗 Related Documentation

- [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md) - Auth & interceptor tests
- [INTERCEPTORS.md](./INTERCEPTORS.md) - Interceptor documentation
- [AUTH_ACCEPTANCE_TEST.md](./AUTH_ACCEPTANCE_TEST.md) - Auth testing guide

---

**Quick Links:**
- Users Page: http://localhost:4200/users
- Auth Test: http://localhost:4200/auth-test
- Backend API: http://localhost:8080/api/users
