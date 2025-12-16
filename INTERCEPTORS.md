# 🔌 HTTP Interceptors Guide

Complete HTTP interceptor chain with loading, auth, and error handling.

## Overview

Three interceptors work together in a specific order:

```
Request  →  LoadingInterceptor  →  AuthInterceptor  →  ErrorInterceptor  →  Backend
Response ←  LoadingInterceptor  ←  AuthInterceptor  ←  ErrorInterceptor  ←  Backend
```

---

## 1. Loading Interceptor

**Purpose:** Show/hide global loading indicator during HTTP requests

**Location:** `src/app/core/http/loading.interceptor.ts`

### Features
- ✅ Tracks concurrent requests
- ✅ Auto-shows loading spinner
- ✅ Auto-hides when all requests complete
- ✅ Optional per-request opt-out

### Usage

#### Basic (Automatic)
```typescript
// All HTTP requests automatically show loading
this.http.get('/api/users').subscribe();
```

#### Skip Loading for Specific Request
```typescript
// Silent request (no loading indicator)
this.http.get('/api/background-sync', {
  headers: { 'X-Skip-Loading': 'true' }
}).subscribe();
```

#### Programmatic Control
```typescript
import { LoadingService } from '@app/core/ui';

private loading = inject(LoadingService);

// Manually show/hide
this.loading.show();
this.loading.hide();

// Force hide (for error recovery)
this.loading.forceHide();

// Check state
console.log(this.loading.isLoading());
```

---

## 2. Auth Interceptor

**Purpose:** Add authentication token + auto-refresh on 401

**Location:** `src/app/core/auth/auth.interceptor.ts`

### Features
- ✅ Automatically adds `Authorization: Bearer <token>` header
- ✅ Auto-refresh access token on 401
- ✅ Request queuing during refresh
- ✅ Skips auth for login/register endpoints

### How It Works

1. **Normal Request:**
   ```
   Request  → Add Bearer token → Backend
   Response ← Success ← Backend
   ```

2. **401 Response (Auto-Refresh):**
   ```
   Request  → With expired token → Backend
   Response ← 401 Unauthorized ← Backend
            ↓
   Refresh  → POST /api/auth/refresh → Backend
   Response ← New token ← Backend
            ↓
   Retry    → With new token → Backend
   Response ← Success ← Backend
   ```

3. **Multiple Concurrent 401s:**
   ```
   Request 1 → 401 → Triggers refresh
   Request 2 → 401 → Waits for refresh
   Request 3 → 401 → Waits for refresh
            ↓
   Single refresh completes
            ↓
   All 3 requests retry with new token
   ```

### Configuration

Auth endpoints (skipped by interceptor):
```typescript
const authEndpoints = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/register'
];
```

---

## 3. Error Interceptor

**Purpose:** Global HTTP error handling with user-friendly notifications

**Location:** `src/app/core/http/error.interceptor.ts`

### Features
- ✅ Automatic error notifications
- ✅ User-friendly error messages
- ✅ Smart backend message extraction
- ✅ Skips 401 (handled by auth interceptor)

### Error Handling Matrix

| Status | Notification | Duration |
|--------|-------------|----------|
| 0 | "Cannot connect to server" | 6s |
| 403 | "Access denied" | 5s |
| 404 | "Resource not found" | 4s |
| 409 | "Conflict: Resource already exists" | 5s |
| 422 | "Validation failed" | 5s |
| 429 | "Too many requests" | 6s (warning) |
| 500 | "Server error" | 6s |
| 502/503/504 | "Service temporarily unavailable" | 6s |

### Backend Message Extraction

The interceptor tries to extract backend error messages in this order:

```typescript
1. error.error.message     // { error: { message: "..." } }
2. error.error.error       // { error: { error: "..." } }
3. error.error.errors[]    // { error: { errors: ["...", "..."] } }
4. error.error (string)    // { error: "..." }
5. error.statusText        // HTTP status text
6. Generic message         // Fallback
```

### Example Backend Response

```json
// Backend sends:
{
  "error": {
    "message": "User with this email already exists",
    "code": "DUPLICATE_EMAIL"
  }
}

// User sees notification:
"User with this email already exists"
```

---

## Configuration

### Interceptor Order in app.config.ts

**IMPORTANT:** Order matters!

```typescript
provideHttpClient(
  withInterceptors([
    loadingInterceptor,  // 1. Track loading (runs first on request)
    authInterceptor,     // 2. Add auth + handle 401
    errorInterceptor     // 3. Handle errors (after refresh attempts)
  ])
)
```

### Why This Order?

1. **Loading First:** Start tracking as soon as request begins
2. **Auth Second:** Add token, try refresh if 401
3. **Error Last:** Handle errors AFTER refresh attempts complete
4. **Loading Last (response):** Stop tracking after everything is done

---

## Testing

### Test Page
http://localhost:4200/interceptor-test

### Manual Testing

#### Test Loading Interceptor
```typescript
// Fast request
this.http.get('/api/test').subscribe();

// Slow request (3s)
this.http.get('/api/test?delay=3000').subscribe();

// Multiple concurrent
Promise.all([
  this.http.get('/api/test/1').toPromise(),
  this.http.get('/api/test/2').toPromise(),
  this.http.get('/api/test/3').toPromise()
]);

// Skip loading
this.http.get('/api/test', {
  headers: { 'X-Skip-Loading': 'true' }
}).subscribe();
```

#### Test Auth Interceptor
```typescript
// Normal request (auto-adds token)
this.http.get('/api/protected').subscribe();

// Force 401 (test auto-refresh)
tokenStorage.access = 'invalid_token';
this.http.get('/api/protected').subscribe();
// Should auto-refresh and retry
```

#### Test Error Interceptor
```typescript
// 404 error
this.http.get('/api/nonexistent').subscribe();
// Notification: "Resource not found"

// 403 error
this.http.get('/api/admin/forbidden').subscribe();
// Notification: "Access denied"

// 500 error
this.http.post('/api/broken', {}).subscribe();
// Notification: "Server error"
```

---

## Real-World Examples

### Form Submission with All Interceptors

```typescript
onSubmit() {
  // Loading: ✓ Shows spinner
  // Auth:    ✓ Adds token
  // Error:   ✓ Shows notification if fails

  this.userService.create(this.form.value).subscribe({
    next: (user) => {
      this.notify.success('User created!');
      this.router.navigate(['/users', user.id]);
    },
    error: (err) => {
      // Error interceptor already showed notification
      // Just handle local state
      this.formSubmitting = false;
    }
  });
}
```

### Background Sync (Silent)

```typescript
syncInBackground() {
  // Skip loading, skip error notifications
  this.http.post('/api/sync', data, {
    headers: { 'X-Skip-Loading': 'true' }
  }).subscribe({
    next: () => console.log('Synced'),
    error: () => console.log('Sync failed (silent)')
  });
}
```

### File Upload with Progress

```typescript
uploadFile(file: File) {
  // Loading indicator + error handling
  const formData = new FormData();
  formData.append('file', file);

  this.http.post('/api/upload', formData, {
    reportProgress: true,
    observe: 'events'
  }).subscribe({
    next: (event) => {
      if (event.type === HttpEventType.UploadProgress) {
        const progress = Math.round(100 * event.loaded / event.total!);
        this.uploadProgress.set(progress);
      } else if (event.type === HttpEventType.Response) {
        this.notify.success('File uploaded!');
      }
    },
    error: () => {
      // Error interceptor handles notification
      this.uploadProgress.set(0);
    }
  });
}
```

---

## Advanced Configuration

### Custom Loading Indicator

Replace default spinner in `app.component.html`:

```typescript
<!-- Default -->
<app-loading-indicator />

<!-- Custom -->
<div *ngIf="loading.isLoading()">
  <my-custom-spinner></my-custom-spinner>
</div>
```

### Custom Error Handling for Specific Routes

```typescript
this.http.get('/api/optional-data').subscribe({
  error: (err) => {
    if (err.status === 404) {
      // Custom handling for this specific case
      this.useDefaultData();
      return;
    }
    // Let error interceptor handle others
  }
});
```

### Disable Notifications for Specific Error

```typescript
// Error interceptor checks for custom header
this.http.delete('/api/resource', {
  headers: { 'X-Skip-Error-Notification': 'true' }
}).subscribe({
  error: (err) => {
    // Handle error manually
    this.showCustomErrorDialog(err);
  }
});
```

---

## Debugging

### Check Interceptor Execution

Open browser console and look for logs:

```
[Loading Interceptor] Request count: 1
[Auth Interceptor] Adding Bearer token
[Auth Interceptor] Token refresh failed
[Error Interceptor] {status: 404, message: "Not found", url: "/api/user/123"}
[Loading Interceptor] Request count: 0
```

### Network Tab

1. Open DevTools → Network
2. Filter: `/api`
3. Check request headers:
   - `Authorization: Bearer ...` (from auth interceptor)
4. Check response times (loading duration)
5. Check error responses (error interceptor messages)

### Common Issues

**Issue:** Loading never hides
**Solution:** Check console for errors, use `loading.forceHide()`

**Issue:** 401 not auto-refreshing
**Solution:** Check refresh token exists in localStorage

**Issue:** Error notifications don't show
**Solution:** Check NotifyService is injected, check browser console

---

## Performance

### Interceptor Overhead

- **Loading:** < 1ms per request
- **Auth:** < 1ms (token lookup)
- **Error:** < 1ms (only on errors)

### Optimization Tips

1. **Skip loading for frequent background requests:**
   ```typescript
   headers: { 'X-Skip-Loading': 'true' }
   ```

2. **Batch requests to reduce interceptor calls:**
   ```typescript
   // Bad: 100 requests
   for (let id of ids) {
     this.http.get(`/api/user/${id}`).subscribe();
   }

   // Good: 1 request
   this.http.post('/api/users/batch', { ids }).subscribe();
   ```

3. **Use HTTP caching for repeated requests:**
   ```typescript
   // Add caching header
   this.http.get('/api/config', {
     headers: { 'Cache-Control': 'max-age=3600' }
   }).subscribe();
   ```

---

## Future Enhancements

Potential additions (not implemented):

- [ ] Retry logic with exponential backoff
- [ ] Request cancellation on navigation
- [ ] Request deduplication
- [ ] Offline queue
- [ ] Rate limiting
- [ ] Request/response logging
- [ ] Performance metrics
- [ ] Custom error pages for 500/503

---

Built for Angular 18+ standalone components.
