export interface FinancialNotificationEvent {
  packageName: string;
  postedAt: string;
  title?: string;
  body?: string;
}

export interface NotificationIngestPort {
  isAvailable(): Promise<boolean>;
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<void>;
  openNotificationAccessSettings(): Promise<void>;
  setAllowedPackages(packages: string[]): Promise<void>;
  startListener(): Promise<void>;
  stopListener(): Promise<void>;
  onEvent(callback: (event: FinancialNotificationEvent) => void): () => void;
}
