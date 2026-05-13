import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ALLOWED_FINANCE_NOTIFICATION_PACKAGES,
  GOOGLE_WALLET_NOTIFICATION_PACKAGE,
} from "./allowed-notification-packages";

const STORAGE_KEY = "@fc_wallet_bank_payment_signals_v1";
const WINDOW_MS = 20 * 60 * 1000;
const MAX_SIGNALS = 80;

export type WalletBankPaymentSignal = {
  at: string;
  amount: number;
  direction: "income" | "expense";
  packageName: string;
};

const bankPackages: Set<string> = new Set(
  ALLOWED_FINANCE_NOTIFICATION_PACKAGES.filter((p) => p !== GOOGLE_WALLET_NOTIFICATION_PACKAGE),
);

function isWalletBankPair(a: string, b: string): boolean {
  const aw = a === GOOGLE_WALLET_NOTIFICATION_PACKAGE;
  const bw = b === GOOGLE_WALLET_NOTIFICATION_PACKAGE;
  if (aw === bw) return false;
  if (aw && bankPackages.has(b)) return true;
  if (bw && bankPackages.has(a)) return true;
  return false;
}

function prune(signals: WalletBankPaymentSignal[], now: number): WalletBankPaymentSignal[] {
  return signals.filter((s) => now - new Date(s.at).getTime() <= WINDOW_MS);
}

async function readSignals(): Promise<WalletBankPaymentSignal[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WalletBankPaymentSignal[];
  } catch {
    return [];
  }
}

async function writeSignals(signals: WalletBankPaymentSignal[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(signals.slice(-MAX_SIGNALS)));
}

/**
 * Detects the same physical payment mirrored by Google Wallet and a banking app within 20 minutes
 * (same amount, same income/expense, different packages, one side Wallet).
 */
export async function shouldSkipAsWalletBankMirrorPayment(params: {
  packageName: string;
  amount: number;
  direction: "income" | "expense";
}): Promise<boolean> {
  const now = Date.now();
  const signals = prune(await readSignals(), now);

  for (const prev of signals) {
    if (prev.direction !== params.direction) continue;
    if (prev.packageName === params.packageName) continue;
    if (Math.abs(prev.amount - params.amount) > 0.009) continue;
    if (!isWalletBankPair(prev.packageName, params.packageName)) continue;
    return true;
  }
  return false;
}

/** Call only after a statement was successfully created from a notification. */
export async function recordPaymentSignalForWalletBankDedupe(signal: WalletBankPaymentSignal): Promise<void> {
  const now = Date.now();
  const merged = prune(await readSignals(), now);
  merged.push(signal);
  await writeSignals(merged);
}
