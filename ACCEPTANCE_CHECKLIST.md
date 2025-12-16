# ⚡ Quick Acceptance Checklist

## 🚀 Start

```bash
# Terminal 1 - Backend
cd ../aqyldy-kundelik-backend
npm start

# Terminal 2 - Frontend
npm start
```

**Opens:** http://localhost:4200/acceptance

---

## ✅ Test 1: Loading Interceptor

**Action:** Click **"Test Loading (3s)"**

**Expected:**
1. ✓ Loading spinner appears (top-right corner)
2. ✓ Waits 3 seconds
3. ✓ Loading spinner disappears

**Watch:**
- Loading Status card turns yellow while loading
- Badge changes: "Idle" → "Loading..." → "Idle"

**Console:**
```
🧪 Test: Loading Interceptor
[Loading Interceptor] Request count: 1
[Loading Interceptor] Request count: 0
✓ Request completed
```

---

## ✅ Test 2: Error 404

**Action:** Click **"Trigger 404 Error"**

**Expected:**
1. ✓ Loading spinner shows/hides
2. ✓ Red notification appears at bottom
3. ✓ Message: "Resource not found"
4. ✓ Auto-dismisses in 4 seconds

**Watch:**
- Notification slides up from bottom
- Red color (error)
- "OK" button to dismiss manually

**Console:**
```
🧪 Test: Error 404
[Error Interceptor] 404: Resource not found
✓ Got expected 404: 404
```

---

## ✅ Test 3: Error 500

**Action:** Click **"Trigger 500 Error"**

**Expected:**
1. ✓ Loading spinner shows/hides
2. ✓ Red notification appears
3. ✓ Message: "Server error. Please try again later."
4. ✓ Auto-dismisses in 6 seconds

**Watch:**
- Same as Test 2, but different message

**Console:**
```
🧪 Test: Error 500
[Error Interceptor] 500: Server error
✓ Got error: 500
```

---

## ✅ Test 4: Auth Auto-Refresh (IMPORTANT!)

**Prerequisites:**
1. Must be logged in first
2. Go to http://localhost:4200/auth-test
3. Login with `admin@local` / `admin123`
4. Return to http://localhost:4200/acceptance

**Action:** Click **"Test Auto-Refresh"**

**Expected:**
1. ✓ Access token gets invalidated (status updates)
2. ✓ Request sent → 401 response
3. ✓ **Automatic** POST to `/api/auth/refresh`
4. ✓ New token saved
5. ✓ Original request retried with new token
6. ✓ Success (or 404 if endpoint missing, but no error notification)

**Watch Network Tab:**
```
1. GET /api/test/protected → 401 Unauthorized
2. POST /api/auth/refresh → 200 OK         (automatic!)
3. GET /api/test/protected → 200 OK/404    (retry with new token)
```

**Console:**
```
🧪 Test: Auth Auto-Refresh on 401
1. Invalidating access token...
2. Making request with invalid token...
[Auth Interceptor] Token expired, refreshing...
[Auth Interceptor] Token refreshed successfully
✓ Success after auto-refresh!
```

**If it fails:**
- Check refresh token exists: `localStorage.getItem('aq_refresh')`
- Check backend `/api/auth/refresh` endpoint works
- Look for console errors

---

## ✅ Test 5: Multiple Errors

**Action:** Click **"Trigger 3 Errors"**

**Expected:**
1. ✓ 3 notifications appear sequentially
2. ✓ Stack on top of each other
3. ✓ All auto-dismiss

**Watch:**
- First notification at bottom
- Second stacks above first
- Third stacks above second
- All dismiss in order

**Console:**
```
🧪 Test: Multiple Errors
Error 1/3...
Error 2/3...
Error 3/3...
```

---

## ✅ Test 6: Success Case

**Prerequisites:** Must be logged in

**Action:** Click **"Test Valid Request"**

**Expected:**
1. ✓ Loading spinner shows/hides
2. ✓ No error notification (even if 404)
3. ✓ Network tab shows `Authorization: Bearer ...` header

**Watch Network Tab:**
```
GET /api/test/success
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Console:**
```
🧪 Test: Valid Request
✓ Request completed
```

---

## 🎯 Full Flow Test (Bonus)

**Test all interceptors together:**

1. **Start logged in** (from auth-test page)
2. Click **"Test Auto-Refresh"** → Check auto-refresh works
3. Click **"Test Loading (3s)"** → Check loading works
4. Click **"Trigger 404 Error"** → Check error notification
5. Click **"Test Valid Request"** → Check success case

**All should work smoothly without errors!**

---

## 📊 Acceptance Criteria Summary

### ✅ Loading Interceptor
- [x] Shows spinner during requests
- [x] Hides spinner after completion
- [x] Handles concurrent requests correctly
- [x] Visual indicator in top-right

### ✅ Auth Interceptor
- [x] Adds Bearer token automatically
- [x] Detects 401 errors
- [x] Auto-refreshes token
- [x] Retries original request
- [x] Queues requests during refresh
- [x] No manual intervention needed

### ✅ Error Interceptor
- [x] Shows user-friendly messages
- [x] Different messages per status code
- [x] Auto-dismisses notifications
- [x] Doesn't show notification for 401 (auth handles)
- [x] Extracts backend error messages

### ✅ Integration
- [x] All 3 interceptors work together
- [x] Correct order (loading → auth → error)
- [x] No conflicts or race conditions
- [x] Smooth user experience

---

## 🐛 Common Issues

### Issue: Loading never hides
**Solution:**
```typescript
// In browser console
import { LoadingService } from '@app/core/ui';
inject(LoadingService).forceHide();
```

### Issue: "Login first!" warning
**Solution:** Go to `/auth-test` and login first

### Issue: Auto-refresh doesn't work
**Check:**
1. Logged in? Check `localStorage.aq_refresh`
2. Backend running? Check `http://localhost:8080/api/auth/refresh`
3. Console errors? Look for auth interceptor logs

### Issue: No notifications appear
**Check:**
1. NotifyService styles injected? Check DevTools → Elements
2. Check z-index of notifications
3. Browser console for errors

---

## 📸 Screenshots (What to Expect)

### Loading State
```
┌─────────────────────────────────────┐
│  🔄 Loading Status          [🔄]   │  ← Spinner appears
│  Badge: "Loading..."               │
│  Card background: Yellow            │
└─────────────────────────────────────┘
```

### Error Notification
```
                                Bottom of screen ↓
┌──────────────────────────────────────────────────┐
│  ✗  Resource not found                    [OK]   │  ← Red
└──────────────────────────────────────────────────┘
```

### Multiple Notifications
```
┌──────────────────────────────────────────────────┐
│  ✗  Server error                          [OK]   │
├──────────────────────────────────────────────────┤
│  ✗  Resource not found                    [OK]   │
├──────────────────────────────────────────────────┤
│  ✗  Access denied                         [OK]   │
└──────────────────────────────────────────────────┘
```

---

## ✅ All Tests Passed?

If all 6 tests pass:

✓ Loading Interceptor works
✓ Auth Interceptor works
✓ Error Interceptor works
✓ All integrated correctly

**You're ready for production! 🎉**

---

## 🔍 Debug Commands

```javascript
// Check tokens
sessionStorage.getItem('aq_access')
localStorage.getItem('aq_refresh')

// Check loading state
// (need to inject LoadingService)

// Check auth status
// (need to inject AuthService)

// Clear everything
sessionStorage.clear()
localStorage.clear()
location.reload()
```

---

## 📝 Report Template

```
✅ ACCEPTANCE TEST REPORT

Date: [DATE]
Tester: [NAME]

Test Results:
[ ] Test 1: Loading Interceptor - PASS/FAIL
[ ] Test 2: Error 404 - PASS/FAIL
[ ] Test 3: Error 500 - PASS/FAIL
[ ] Test 4: Auth Auto-Refresh - PASS/FAIL
[ ] Test 5: Multiple Errors - PASS/FAIL
[ ] Test 6: Success Case - PASS/FAIL

Issues Found:
- [List any issues]

Notes:
- [Additional observations]

Status: APPROVED / NEEDS FIXES
```

---

**Quick link:** http://localhost:4200/acceptance
