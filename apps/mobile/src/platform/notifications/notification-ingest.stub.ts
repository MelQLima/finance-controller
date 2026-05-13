import type { FinancialNotificationEvent, NotificationIngestPort } from "./notification-ingest-port";

function noop() {
  return undefined;
}

export const notificationIngest: NotificationIngestPort = {
  async isAvailable() {
    return false;
  },
  async hasPermission() {
    return false;
  },
  async requestPermission() {
    throw new Error("Módulo nativo de notificações ainda não implementado.");
  },
  async openNotificationAccessSettings() {
    throw new Error("Módulo nativo de notificações ainda não implementado.");
  },
  async setAllowedPackages() {
    throw new Error("Módulo nativo de notificações ainda não implementado.");
  },
  async startListener() {
    throw new Error("Módulo nativo de notificações ainda não implementado.");
  },
  async stopListener() {
    throw new Error("Módulo nativo de notificações ainda não implementado.");
  },
  onEvent(_callback: (event: FinancialNotificationEvent) => void) {
    return noop;
  },
};
