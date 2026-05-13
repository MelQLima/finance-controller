import AsyncStorage from "@react-native-async-storage/async-storage";
import { ALLOWED_FINANCE_NOTIFICATION_PACKAGES } from "./allowed-notification-packages";
import { notificationIngest } from "./notification-ingest";

const USER_PAUSED_KEY = "@fc_notification_listener_user_paused";

/**
 * Applies allowlist + enables native listening when the OS already granted notification access.
 * Safe to call on every app foreground: idempotent for the JS bridge.
 */
export async function armFinanceNotificationListenerIfPermitted(): Promise<boolean> {
  try {
    const available = await notificationIngest.isAvailable();
    if (!available) return false;
    const permitted = await notificationIngest.hasPermission();
    if (!permitted) return false;
    if ((await AsyncStorage.getItem(USER_PAUSED_KEY)) === "true") return false;
    await notificationIngest.setAllowedPackages([...ALLOWED_FINANCE_NOTIFICATION_PACKAGES]);
    await notificationIngest.startListener();
    return true;
  } catch {
    return false;
  }
}

export async function setNotificationListenerUserPaused(paused: boolean): Promise<void> {
  if (paused) await AsyncStorage.setItem(USER_PAUSED_KEY, "true");
  else await AsyncStorage.removeItem(USER_PAUSED_KEY);
}
