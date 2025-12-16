# 🔔 Notification Service

Lightweight toast/snackbar notification system **without Angular Material dependency**.

## Features

✅ **Zero dependencies** - No Material, pure TypeScript/DOM
✅ **4 notification types** - Success, Error, Info, Warning
✅ **Auto-dismiss** - Configurable duration
✅ **Multiple notifications** - Stack notifications with animations
✅ **Responsive** - Mobile-friendly
✅ **XSS protection** - HTML escaping built-in
✅ **Type-safe** - Full TypeScript support

---

## Installation

Already installed! The service is in `src/app/core/ui/notify.service.ts`

No need to add to providers - it uses `providedIn: 'root'`

---

## Basic Usage

### Import and Inject

```typescript
import { Component, inject } from '@angular/core';
import { NotifyService } from '@app/core/ui';

@Component({...})
export class MyComponent {
  private notify = inject(NotifyService);

  doSomething() {
    this.notify.success('Operation completed!');
  }
}
```

### Notification Types

```typescript
// Success (green) - 3s default
notify.success('User created successfully!');

// Error (red) - 5s default
notify.error('Failed to save data');

// Info (blue) - 3s default
notify.info('New version available');

// Warning (orange) - 4s default
notify.warning('This action cannot be undone');
```

### Custom Duration

```typescript
// Short notification (1 second)
notify.success('Copied!', 1000);

// Long notification (10 seconds)
notify.error('Critical error details...', 10000);

// Infinite (user must dismiss manually)
notify.info('Important message', 0);
```

### Advanced Usage

```typescript
// Custom notification
notify.show({
  message: 'Custom notification',
  type: 'success',
  duration: 5000,
  action: 'View Details'
});

// Clear all notifications
notify.clearAll();
```

---

## Real-World Examples

### Form Submission

```typescript
onSubmit() {
  this.userService.create(this.form.value).subscribe({
    next: () => {
      this.notify.success('User created successfully!');
      this.router.navigate(['/users']);
    },
    error: (err) => {
      this.notify.error('Failed to create user: ' + err.message);
    }
  });
}
```

### HTTP Errors

```typescript
deleteUser(id: string) {
  this.http.delete(`/api/users/${id}`).subscribe({
    next: () => this.notify.success('User deleted'),
    error: (err) => {
      if (err.status === 404) {
        this.notify.error('User not found');
      } else if (err.status === 403) {
        this.notify.error('Permission denied');
      } else {
        this.notify.error('Failed to delete user');
      }
    }
  });
}
```

### Copy to Clipboard

```typescript
copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    () => this.notify.success('Copied to clipboard!', 1500),
    () => this.notify.error('Failed to copy')
  );
}
```

### File Upload

```typescript
uploadFile(file: File) {
  this.notify.info('Uploading file...');

  this.fileService.upload(file).subscribe({
    next: () => {
      this.notify.success('File uploaded successfully!');
    },
    error: () => {
      this.notify.error('Upload failed. Please try again.');
    }
  });
}
```

### Auth Integration

```typescript
login(credentials: LoginRequest) {
  this.auth.login(credentials).subscribe({
    next: () => {
      this.notify.success('Welcome back!');
      this.router.navigate(['/dashboard']);
    },
    error: (err) => {
      if (err.status === 401) {
        this.notify.error('Invalid email or password');
      } else if (err.status === 0) {
        this.notify.error('Cannot connect to server');
      } else {
        this.notify.error('Login failed. Please try again.');
      }
    }
  });
}
```

---

## API Reference

### Methods

#### `success(message: string, duration?: number): void`
Show success notification (green). Default duration: 3000ms.

#### `error(message: string, duration?: number): void`
Show error notification (red). Default duration: 5000ms.

#### `info(message: string, duration?: number): void`
Show info notification (blue). Default duration: 3000ms.

#### `warning(message: string, duration?: number): void`
Show warning notification (orange). Default duration: 4000ms.

#### `show(config: NotificationConfig): void`
Show custom notification with full control.

#### `clearAll(): void`
Dismiss all active notifications immediately.

### Types

```typescript
type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationConfig {
  message: string;
  type: NotificationType;
  duration?: number;  // milliseconds, 0 = infinite
  action?: string;    // action button text (default: 'OK')
}
```

---

## Styling

### Default Colors

- **Success**: `#16a34a` (green)
- **Error**: `#dc2626` (red)
- **Info**: `#2563eb` (blue)
- **Warning**: `#ea580c` (orange)

### Custom Styling

The service injects styles automatically. To override:

```css
/* In your global styles.css */

.notify-toast {
  font-family: 'Your Custom Font', sans-serif !important;
  border-radius: 12px !important;
}

.notify-success {
  background: #your-color !important;
}

.notify-icon {
  font-size: 24px !important;
}
```

---

## Demo

Test all features at: http://localhost:4200/notify-demo

Or add to your component:

```typescript
<button (click)="notify.success('Test notification')">
  Test Notification
</button>
```

---

## Migration from Angular Material

### Before (Material Snackbar)

```typescript
import { MatSnackBar } from '@angular/material/snack-bar';

constructor(private snack: MatSnackBar) {}

show() {
  this.snack.open('Message', 'OK', {
    duration: 3000,
    panelClass: ['snack-success']
  });
}
```

### After (NotifyService)

```typescript
import { NotifyService } from '@app/core/ui';

private notify = inject(NotifyService);

show() {
  this.notify.success('Message', 3000);
}
```

**Benefits:**
- ✅ No Material dependency (~500KB saved)
- ✅ Simpler API
- ✅ Better TypeScript support
- ✅ More control over styling

---

## Alternative: Material Version

If you prefer Angular Material, see `notify-material.service.ts`:

```bash
# Install Material
ng add @angular/material

# Uncomment code in notify-material.service.ts
# Use NotifyMaterialService instead of NotifyService
```

---

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

Uses standard DOM APIs (no IE11 support needed in 2025).

---

## Performance

- **Lazy loaded** - Styles injected only when first notification shown
- **Efficient** - No virtual DOM, direct DOM manipulation
- **Small** - ~3KB gzipped
- **Fast** - CSS animations, no JavaScript animations

---

## Security

✅ **XSS Protected** - All messages are HTML-escaped
✅ **No innerHTML** - Uses textContent for user data
✅ **Safe** - Action button only dismisses, no custom handlers

---

## Troubleshooting

### Notifications not showing

1. Check service is imported:
   ```typescript
   import { NotifyService } from '@app/core/ui';
   ```

2. Check injection:
   ```typescript
   private notify = inject(NotifyService);
   ```

3. Check browser console for errors

### Notifications overlap other content

Add higher z-index:
```css
.notify-container {
  z-index: 10000 !important;
}
```

### Multiple notifications don't stack

This should work automatically. Check browser console for errors.

---

## Examples Repository

See `notify-demo.component.ts` for comprehensive examples.

---

## Future Enhancements

Potential additions (not implemented yet):

- Progress bar for duration
- Click handlers for action buttons
- Icons customization
- Sound effects
- Position customization (top/bottom/left/right)
- Notification queue limits
- Undo actions

---

Built with ❤️ for Angular 18+ standalone components.
