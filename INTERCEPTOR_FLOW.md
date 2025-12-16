# 🔄 Interceptor Flow Diagram

## Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTION                              │
│                    (e.g., Click "Submit")                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HTTP CLIENT REQUEST                           │
│                 (e.g., POST /api/users)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REQUEST PHASE →
                             │
        ╔════════════════════▼═════════════════════╗
        ║   1. LOADING INTERCEPTOR                 ║
        ║   • requestCount++                       ║
        ║   • isLoading.set(true)                  ║
        ║   • Show spinner                         ║
        ╚════════════════════╦═════════════════════╝
                             │
                             ▼
        ╔════════════════════▼═════════════════════╗
        ║   2. AUTH INTERCEPTOR                    ║
        ║   • Get access token from storage        ║
        ║   • Add header:                          ║
        ║     Authorization: Bearer <token>        ║
        ╚════════════════════╦═════════════════════╝
                             │
                             ▼
        ╔════════════════════▼═════════════════════╗
        ║   3. ERROR INTERCEPTOR                   ║
        ║   • Pass through (no action on request)  ║
        ╚════════════════════╦═════════════════════╝
                             │
                             ▼
                    ┌────────────────┐
                    │   BACKEND API  │
                    │  (localhost:   │
                    │     8080)      │
                    └────────┬───────┘
                             │
                             │ RESPONSE PHASE ←
                             │
                    ┌────────▼────────┐
                    │   Success or    │
                    │     Error?      │
                    └────┬────────┬───┘
                         │        │
                    ┌────▼───┐  ┌▼─────────┐
                    │SUCCESS │  │  ERROR   │
                    └────┬───┘  └┬─────────┘
                         │       │
         ╔═══════════════▼═══════▼═══════════════════╗
         ║   3. ERROR INTERCEPTOR (Response)         ║
         ║                                           ║
         ║   IF SUCCESS:                             ║
         ║   • Pass through                          ║
         ║                                           ║
         ║   IF 401 (Unauthorized):                  ║
         ║   • Skip (auth interceptor handles)       ║
         ║                                           ║
         ║   IF OTHER ERROR (403, 404, 500, etc.):   ║
         ║   • Extract error message                 ║
         ║   • notify.error(message)                 ║
         ║   • Show red notification                 ║
         ╚═══════════════╦═══════════════════════════╝
                         │
                         ▼
         ╔═══════════════▼═══════════════════════════╗
         ║   2. AUTH INTERCEPTOR (Response)          ║
         ║                                           ║
         ║   IF SUCCESS:                             ║
         ║   • Pass through                          ║
         ║                                           ║
         ║   IF 401:                                 ║
         ║   ┌─────────────────────────────────┐    ║
         ║   │ a) Check refresh token exists   │    ║
         ║   │ b) POST /api/auth/refresh       │    ║
         ║   │ c) Save new access token        │    ║
         ║   │ d) Retry original request       │    ║
         ║   │ e) Return result to user        │    ║
         ║   └─────────────────────────────────┘    ║
         ║                                           ║
         ║   IF REFRESH FAILS:                       ║
         ║   • Clear all tokens                      ║
         ║   • Throw error                           ║
         ╚═══════════════╦═══════════════════════════╝
                         │
                         ▼
         ╔═══════════════▼═══════════════════════════╗
         ║   1. LOADING INTERCEPTOR (Response)       ║
         ║   • requestCount--                        ║
         ║   • if (requestCount === 0):              ║
         ║     isLoading.set(false)                  ║
         ║   • Hide spinner                          ║
         ╚═══════════════╦═══════════════════════════╝
                         │
                         ▼
                 ┌───────────────┐
                 │  COMPONENT    │
                 │  .subscribe({ │
                 │    next,      │
                 │    error      │
                 │  })           │
                 └───────────────┘
```

---

## Scenario Examples

### 🟢 Scenario 1: Successful Request

```
User clicks "Save"
    ↓
1. Loading: Show spinner ⏳
    ↓
2. Auth: Add "Authorization: Bearer eyJhbGc..."
    ↓
3. Error: Pass through
    ↓
Backend: 200 OK ✓
    ↓
3. Error: Pass through
    ↓
2. Auth: Pass through
    ↓
1. Loading: Hide spinner
    ↓
Component: Success! 🎉
```

---

### 🔴 Scenario 2: 404 Error

```
User clicks "Load User"
    ↓
1. Loading: Show spinner ⏳
    ↓
2. Auth: Add Bearer token
    ↓
3. Error: Pass through
    ↓
Backend: 404 Not Found ✗
    ↓
3. Error: Show "Resource not found" 🔴
    ↓
2. Auth: Pass through (not 401)
    ↓
1. Loading: Hide spinner
    ↓
Component: Error handler called
```

---

### 🔄 Scenario 3: 401 → Auto-Refresh → Success

```
User clicks "Get Data"
    ↓
1. Loading: Show spinner ⏳
    ↓
2. Auth: Add Bearer <expired_token>
    ↓
3. Error: Pass through
    ↓
Backend: 401 Unauthorized ✗
    ↓
3. Error: Skip (not handling 401)
    ↓
2. Auth: Token expired! Let me fix that...
    ↓
    POST /api/auth/refresh
        ↓
    Backend: 200 OK, here's new token
        ↓
    Save new access token
        ↓
    Retry original request with new token
        ↓
    Backend: 200 OK ✓
    ↓
2. Auth: Success! Return data
    ↓
1. Loading: Hide spinner
    ↓
Component: Data received! 🎉
(User doesn't even know refresh happened!)
```

---

### 🔄 Scenario 4: Multiple Concurrent Requests

```
User clicks "Load Dashboard"
(triggers 5 API calls)

Request 1 starts
    ↓
1. Loading: requestCount = 1, show spinner ⏳

Request 2 starts
    ↓
1. Loading: requestCount = 2, spinner already showing

Request 3 starts
    ↓
1. Loading: requestCount = 3, spinner already showing

Request 1 completes
    ↓
1. Loading: requestCount = 2, keep spinner

Request 2 completes
    ↓
1. Loading: requestCount = 1, keep spinner

Request 3 completes
    ↓
1. Loading: requestCount = 0, hide spinner ✓
```

---

### 🚫 Scenario 5: Multiple 401s (Request Queuing)

```
3 requests sent simultaneously with expired token:

Request A: GET /api/users
    ↓
401 → Auth: Start refresh, queue A

Request B: GET /api/posts
    ↓
401 → Auth: Refresh in progress, queue B

Request C: GET /api/comments
    ↓
401 → Auth: Refresh in progress, queue C

    ↓
Single refresh completes
    ↓
All 3 requests retry with new token
    ↓
Request A: 200 ✓
Request B: 200 ✓
Request C: 200 ✓

Result: Only ONE refresh call! 🎯
```

---

## Interceptor Order Matters!

### ❌ WRONG Order:
```typescript
withInterceptors([
  errorInterceptor,  // ✗ Would see 401 before refresh
  authInterceptor,
  loadingInterceptor // ✗ Would finish before error handled
])
```

**Problems:**
- Error interceptor sees 401 before auth can refresh
- Loading indicator hides before errors are processed
- User sees "Unauthorized" instead of automatic refresh

### ✅ CORRECT Order:
```typescript
withInterceptors([
  loadingInterceptor,  // ✓ Start tracking first
  authInterceptor,     // ✓ Add token, handle 401
  errorInterceptor     // ✓ Handle errors last
])
```

**Benefits:**
- Loading tracks entire request lifecycle
- Auth gets chance to refresh before error notification
- Error interceptor only sees "real" errors
- User gets smooth experience

---

## Skip Loading Example

```typescript
// Normal request (with loading)
this.http.get('/api/users').subscribe();
// → Spinner shows

// Background sync (skip loading)
this.http.post('/api/sync', data, {
  headers: { 'X-Skip-Loading': 'true' }
}).subscribe();
// → No spinner

// Result: User doesn't see loading for background tasks
```

---

## Token Refresh Flow (Detailed)

```
┌─────────────────────────────────────────────────────────┐
│  Request with Expired Token                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Auth Interceptor      │
        │  catchError((error) => │
        │    if (401) ...        │
        └──────────┬─────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Is refreshing?      │
        └──┬──────────────┬────┘
           │ No           │ Yes
           ▼              ▼
  ┌────────────────┐  ┌──────────────────┐
  │ Start refresh  │  │ Wait for refresh │
  │ isRefreshing   │  │ (queue request)  │
  │   = true       │  │                  │
  └────┬───────────┘  └────────┬─────────┘
       │                       │
       ▼                       │
  ┌──────────────────┐         │
  │ POST /api/auth/  │         │
  │      refresh     │         │
  └────┬─────────────┘         │
       │                       │
       ▼                       │
  ┌─────────────┐              │
  │  Success?   │              │
  └┬───────────┬┘              │
   │ Yes       │ No            │
   ▼           ▼               │
┌──────┐  ┌─────────┐          │
│ Save │  │  Clear  │          │
│ new  │  │ tokens  │          │
│token │  │ Logout  │          │
└──┬───┘  └────┬────┘          │
   │           │               │
   │           ▼               │
   │      ┌─────────┐          │
   │      │  Error  │          │
   │      └─────────┘          │
   │                           │
   ▼                           │
┌────────────────────────┐     │
│ isRefreshing = false   │     │
│ Broadcast new token    │◄────┘
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Retry all queued       │
│ requests with new      │
│ token                  │
└────────────────────────┘
```

---

## Console Logs Timeline

Watch browser console during a request:

```
[Loading Interceptor] Request count: 1
[Auth Interceptor] Adding Bearer token to request
[Backend] → GET /api/users
[Backend] ← 200 OK
[Error Interceptor] Request succeeded
[Loading Interceptor] Request count: 0
```

With 401:
```
[Loading Interceptor] Request count: 1
[Auth Interceptor] Adding Bearer token to request
[Backend] → GET /api/users
[Backend] ← 401 Unauthorized
[Auth Interceptor] Token expired, refreshing...
[Backend] → POST /api/auth/refresh
[Backend] ← 200 OK (new token)
[Auth Interceptor] Token refreshed, retrying request
[Backend] → GET /api/users (with new token)
[Backend] ← 200 OK
[Loading Interceptor] Request count: 0
```

With error:
```
[Loading Interceptor] Request count: 1
[Auth Interceptor] Adding Bearer token to request
[Backend] → GET /api/users/999
[Backend] ← 404 Not Found
[Error Interceptor] 404: Resource not found
[Notify Service] Showing error notification
[Loading Interceptor] Request count: 0
```

---

This visual guide helps understand how all three interceptors work together seamlessly! 🎯
