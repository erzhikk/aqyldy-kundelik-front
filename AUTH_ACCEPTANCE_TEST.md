# 🔐 Auth System - Acceptance Test Guide

## Подготовка

### 1. Запустить Backend
```bash
cd ../aqyldy-kundelik-backend
npm start
# Должен быть на http://localhost:8080
# Admin seed: admin@local / admin123
```

### 2. Запустить Frontend
```bash
npm start
# Откроется на http://localhost:4200
# Автоматически откроется /auth-test
```

---

## ✅ Test Checklist

### Test 1: Login → Tokens Saved
**Цель:** Проверить что токены сохраняются после успешного логина

1. Открыть http://localhost:4200/auth-test
2. В форме логина ввести:
   - Email: `admin@local`
   - Password: `admin123`
3. Нажать **Login**

**Ожидаемый результат:**
- ✓ Test Result: "Login - ✓ success"
- ✓ Status Panel показывает:
  - Access Token: `✓ Present`
  - Refresh Token: `✓ Present`
  - User ID: `{UUID}`
  - Roles: `ADMIN`
  - Token Expired: `✓ No`

**Проверка в DevTools:**
```javascript
// Console → Application → Storage
sessionStorage.getItem('aq_access') // должен быть JWT токен
localStorage.getItem('aq_refresh')  // должен быть JWT токен
```

**Проверка в Network:**
- POST `/api/auth/login` → 200 OK
- Response body содержит `accessToken`, `refreshToken`, `expiresAt`

---

### Test 2: Protected Request with Authorization Header
**Цель:** Проверить что защищённые запросы уходят с Authorization header

1. После успешного логина нажать **Test Protected Request**

**Ожидаемый результат:**
- ✓ Test Result: "Protected Request - ✓ success"
- Response data отображается в результатах

**Проверка в Network:**
```
GET /api/test/protected
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Test 3: Auto-Refresh on 401
**Цель:** Проверить автоматический refresh токена при получении 401

#### Вариант A: Force 401 через UI (рекомендуется)
1. Нажать **Force 401 & Test Refresh**
2. Компонент инвалидирует access token и делает запрос

**Ожидаемый результат:**
- ✓ Test Result: "Auto Refresh - ✓ success"
- ✓ Токен обновился автоматически
- ✓ Оригинальный запрос повторился успешно

**Проверка в Network:**
```
1. GET /api/test/protected → 401 Unauthorized
2. POST /api/auth/refresh → 200 OK (автоматически!)
3. GET /api/test/protected → 200 OK (повтор с новым токеном)
```

#### Вариант B: Уменьшить TTL на Backend
В `application.yml` бэкенда:
```yaml
app:
  jwt:
    access-expiration: 60000  # 1 минута
```

1. Перезапустить backend
2. Залогиниться
3. Подождать 1 минуту
4. Нажать **Test Protected Request**

**Ожидаемый результат:**
- Interceptor автоматически вызывает refresh
- Запрос выполняется успешно

---

### Test 4: Logout Clears Storage
**Цель:** Проверить что logout очищает все токены

1. После успешного логина нажать **Logout**

**Ожидаемый результат:**
- ✓ Test Result: "Logout - ✓ success"
- ✓ Status Panel показывает:
  - Access Token: `✗ Missing`
  - Refresh Token: `✗ Missing`
  - User ID: `N/A`
  - Roles: `None`

**Проверка в DevTools:**
```javascript
sessionStorage.getItem('aq_access') // null
localStorage.getItem('aq_refresh')  // null
```

**Проверка в Network:**
```
POST /api/auth/logout
Request Body: { "refreshToken": "..." }
Response: 200 OK
```

---

## 🔍 Advanced Tests

### Test 5: Multiple Concurrent 401s (Request Queuing)
**Цель:** Проверить что при нескольких одновременных 401 refresh вызывается только один раз

**Как тестировать:**
1. Открыть Console в DevTools
2. Запустить несколько запросов одновременно:
```javascript
Promise.all([
  fetch('/api/test/protected', {
    headers: { Authorization: 'Bearer invalid_token' }
  }),
  fetch('/api/test/protected', {
    headers: { Authorization: 'Bearer invalid_token' }
  }),
  fetch('/api/test/protected', {
    headers: { Authorization: 'Bearer invalid_token' }
  })
]);
```

**Ожидаемый результат:**
- В Network должен быть **только 1** запрос к `/api/auth/refresh`
- Все 3 оригинальных запроса повторяются с новым токеном
- Все 3 запроса успешны

---

### Test 6: Refresh Token Expired
**Цель:** Проверить поведение при истёкшем refresh token

**Как тестировать:**
1. В DevTools → Console:
```javascript
localStorage.setItem('aq_refresh', 'invalid_or_expired_token')
sessionStorage.setItem('aq_access', 'invalid_token')
```
2. Обновить страницу
3. Нажать **Test Protected Request**

**Ожидаемый результат:**
- ✗ Test Result: "Protected Request - ✗ error"
- Токены очищены автоматически
- Пользователь должен залогиниться заново

---

## 📊 Success Criteria

### ✅ All tests pass if:
1. ✓ Login сохраняет токены в правильное storage (access → session, refresh → local)
2. ✓ Protected requests содержат `Authorization: Bearer <token>`
3. ✓ Auto-refresh работает при 401
4. ✓ Только один refresh запрос при множественных 401
5. ✓ Logout очищает все токены и вызывает backend endpoint
6. ✓ Expired refresh token корректно обрабатывается

### ❌ Tests fail if:
- Токены не сохраняются после login
- Authorization header отсутствует
- 401 не вызывает автоматический refresh
- Множественные refresh при concurrent 401
- Токены остаются после logout
- Expired refresh token не обрабатывается

---

## 🐛 Debugging

### Check Interceptor Logs
В консоли должны быть логи:
```
[Auth Interceptor] Token refresh failed: ...
[Auth Interceptor] No refresh token available, clearing session
```

### Check Network Tab
1. Включить "Preserve log"
2. Фильтр: `/api/auth`
3. Проверить последовательность запросов

### Check Storage
```javascript
// Проверка токенов
console.log('Access:', sessionStorage.getItem('aq_access'));
console.log('Refresh:', localStorage.getItem('aq_refresh'));

// Декодирование токена
const token = sessionStorage.getItem('aq_access');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token payload:', payload);
console.log('Expires at:', new Date(payload.exp * 1000));
```

---

## 🎯 Next Steps

После успешного прохождения всех тестов:

1. **Create Auth Guard:**
   ```typescript
   export const authGuard: CanActivateFn = () => {
     return inject(AuthService).isAuthenticated();
   };
   ```

2. **Create Role Guard:**
   ```typescript
   export const adminGuard: CanActivateFn = () => {
     return inject(AuthService).hasRole('ADMIN');
   };
   ```

3. **Add to Routes:**
   ```typescript
   {
     path: 'admin',
     canActivate: [authGuard, adminGuard],
     loadComponent: () => import('./admin/admin.component')
   }
   ```

4. **Real Login Page:**
   - Заменить тестовый компонент на настоящую login форму
   - Добавить обработку ошибок
   - Редирект после логина

---

## 📝 Notes

- **proxy.conf.json** настроен на `http://localhost:8080`
- **Interceptor** автоматически подключён через `app.config.ts`
- **Token Storage** использует sessionStorage (access) + localStorage (refresh)
- **JWT decode** работает без внешних библиотек
