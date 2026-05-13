const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");
const appConfig = require("../app.json");

function ensureService(mainApplication, serviceName) {
  const services = mainApplication.service ?? [];
  const existing = services.find((item) => {
    const name = item?.$?.["android:name"];
    const filters = item?.["intent-filter"] ?? [];
    const isListenerFilter = filters.some((filter) =>
      (filter?.action ?? []).some(
        (action) =>
          action?.$?.["android:name"] === "android.service.notification.NotificationListenerService"
      )
    );
    return name === serviceName || isListenerFilter;
  });

  if (existing) {
    existing.$ = {
      ...existing.$,
      "android:name": serviceName,
      "android:label": "Finance Controller Notification Listener",
      "android:permission": "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
      "android:exported": "true",
    };
    existing["intent-filter"] = [
      {
        action: [{ $: { "android:name": "android.service.notification.NotificationListenerService" } }],
      },
    ];
    mainApplication.service = services;
    return;
  }

  services.push({
    $: {
      "android:name": serviceName,
      "android:label": "Finance Controller Notification Listener",
      "android:permission": "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
      "android:exported": "true",
    },
    "intent-filter": [
      {
        action: [{ $: { "android:name": "android.service.notification.NotificationListenerService" } }],
      },
    ],
  });

  mainApplication.service = services;
}

module.exports = function withNotificationListener(config) {
  return withAndroidManifest(config, (mod) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    const packageName = appConfig?.expo?.android?.package;
    if (!packageName) {
      throw new Error("Unable to resolve Android package name for NotificationListenerService.");
    }
    const serviceName = `${packageName}.notifications.FinancialNotificationListenerService`;
    ensureService(mainApplication, serviceName);
    return mod;
  });
};
