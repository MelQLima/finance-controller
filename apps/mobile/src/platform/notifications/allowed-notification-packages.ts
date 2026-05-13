/**
 * Package names allowed by the Android notification listener (must match installed banking apps).
 * @see apps/mobile/docs/notification-listener-setup.md
 */
export const GOOGLE_WALLET_NOTIFICATION_PACKAGE = "com.google.android.apps.walletnfcrel" as const;

export const ALLOWED_FINANCE_NOTIFICATION_PACKAGES = [
  "com.nu.production",
  "com.itau",
  "com.itau.iti",
  "com.itaucard.activity",
  "com.picpay",
  "br.com.intermedium",
  GOOGLE_WALLET_NOTIFICATION_PACKAGE,
] as const;
