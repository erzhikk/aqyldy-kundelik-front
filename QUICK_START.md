# 🚀 Quick Start - Auth Testing

## 1. Start Backend
```bash
cd ../aqyldy-kundelik-backend
npm start
```
✓ Backend running on http://localhost:8080

## 2. Start Frontend
```bash
npm start
```
✓ Frontend running on http://localhost:4200

## 3. Open Test Page
http://localhost:4200/auth-test

## 4. Run Tests

### ✅ Test 1: Login
- Email: `admin@local`
- Password: `admin123`
- Click **Login**
- Check tokens in Status Panel

### ✅ Test 2: Protected Request
- Click **Test Protected Request**
- Check Network tab for `Authorization: Bearer ...`

### ✅ Test 3: Auto-Refresh
- Click **Force 401 & Test Refresh**
- Check Network: should see `/api/auth/refresh` call

### ✅ Test 4: Logout
- Click **Logout**
- Check Storage cleared

---

## 📁 Files Overview

```
src/app/
├── core/auth/
│   ├── auth.interceptor.ts      # HTTP interceptor with auto-refresh
│   ├── auth.service.ts          # Login/logout/refresh methods
│   ├── token-storage.service.ts # Token management
│   └── index.ts                 # Barrel export
├── features/auth-test/
│   └── auth-test.component.ts   # Test UI component
├── app.config.ts                # HTTP + Interceptor config
└── app.routes.ts                # Routes

proxy.conf.json                  # Proxy /api → localhost:8080
package.json                     # npm start → ng serve with proxy
```

---

## 🔍 Quick Checks

### Check Tokens in DevTools
```javascript
// Console
sessionStorage.getItem('aq_access')
localStorage.getItem('aq_refresh')
```

### Check Network Requests
1. Open DevTools → Network
2. Filter: `/api/auth`
3. Look for:
   - `POST /api/auth/login` → 200
   - `POST /api/auth/refresh` → 200 (on 401)
   - `POST /api/auth/logout` → 200

### Check Authorization Header
1. Network → any `/api/` request
2. Request Headers should have:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## ✨ What's Configured

✅ Proxy: `/api` → `http://localhost:8080`
✅ HTTP Client with auth interceptor
✅ Auto token refresh on 401
✅ Request queuing during refresh
✅ Token storage (session + local)
✅ JWT decode without libraries

---

For detailed testing instructions, see [AUTH_ACCEPTANCE_TEST.md](./AUTH_ACCEPTANCE_TEST.md)
