import { NativeEventEmitter, NativeModules, Platform } from "react-native";
import type { FinancialNotificationEvent, NotificationIngestPort } from "./notification-ingest-port";
import { notificationIngest as stub } from "./notification-ingest.stub";

type NotificationIngestNativeModule = {
  isAvailable: () => Promise<boolean>;
  hasPermission: () => Promise<boolean>;
  requestPermission: () => Promise<void>;
  openNotificationAccessSettings: () => Promise<void>;
  setAllowedPackages: (packages: string[]) => Promise<void>;
  startListener: () => Promise<void>;
  stopListener: () => Promise<void>;
};

const moduleRef = (NativeModules.NotificationIngestModule ?? null) as NotificationIngestNativeModule | null;
const emitter = moduleRef ? new NativeEventEmitter(moduleRef as never) : null;

export const notificationIngest: NotificationIngestPort =
  Platform.OS !== "android" || !moduleRef
    ? stub
    : {
        isAvailable: () => moduleRef.isAvailable(),
        hasPermission: () => moduleRef.hasPermission(),
        requestPermission: () => moduleRef.requestPermission(),
        openNotificationAccessSettings: () => moduleRef.openNotificationAccessSettings(),
        setAllowedPackages: (packages: string[]) => moduleRef.setAllowedPackages(packages),
        startListener: () => moduleRef.startListener(),
        stopListener: () => moduleRef.stopListener(),
        onEvent(callback: (event: FinancialNotificationEvent) => void) {
          if (!emitter) return () => undefined;
          const subscription = emitter.addListener("financialNotification", callback);
          return () => subscription.remove();
        },
      };
