# Android Notification Listener Setup

This project now includes:

- JS bridge: `src/platform/notifications/notification-ingest.ts`
- Expo manifest plugin: `plugins/with-notification-listener.js`
- Kotlin templates:
  - `native/android-notification-listener/FinancialNotificationListenerService.kt`
  - `native/android-notification-listener/NotificationIngestModule.kt`
  - `native/android-notification-listener/NotificationIngestPackage.kt`

## 1) Generate Android project

From `apps/mobile`:

```bash
npx expo prebuild -p android
```

## 2) Copy Kotlin files

Copy template files into:

`android/app/src/main/java/com/financecontroller/mobile/notifications/`

## 3) Register native package

In `android/app/src/main/java/com/financecontroller/mobile/MainApplication.kt`, add:

```kotlin
import com.financecontroller.mobile.notifications.NotificationIngestPackage
```

and include package in `getPackages()`:

```kotlin
packages.add(NotificationIngestPackage())
```

## 4) Manifest service declaration

`app.json` already includes `./plugins/with-notification-listener`.
Run prebuild again after plugin changes if needed.

The plugin injects:

- `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE` on the service
- `android.service.notification.NotificationListenerService` intent filter

## 5) Build and run

```bash
npx expo run:android
```

## 6) Enable permission in Settings screen

Inside app `Settings`:

- `Solicitar permissao no Android`
- Enable Finance Controller in Android Notification Access screen
- `Iniciar escuta de notificacoes`

## Safety notes

- Listener is Android-only.
- Filtering is allowlist-based (`setAllowedPackages`).
- Keep payload minimal and only process explicit user-approved sources.
