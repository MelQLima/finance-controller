import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  inferNotificationFinancialSummary,
  transactionSchema,
  type InferredNotificationDirection,
} from "@finance-controller/shared";
import type { FinancialNotificationEvent } from "./notification-ingest-port";
import {
  recordPaymentSignalForWalletBankDedupe,
  shouldSkipAsWalletBankMirrorPayment,
} from "./wallet-bank-payment-dedupe";
import { createQuickCategory, getTransactionReferences, upsertTransaction } from "@/features/transactions/transactions-service";

const AUDIT_LOG_KEY = "@fc_notification_ingest_audit_v1";

const recentFingerprints = new Set<string>();
const MAX_DEDUPE = 400;

function touchDedupe(fingerprint: string): boolean {
  if (recentFingerprints.has(fingerprint)) return false;
  recentFingerprints.add(fingerprint);
  if (recentFingerprints.size > MAX_DEDUPE) {
    const toDrop = [...recentFingerprints].slice(0, MAX_DEDUPE / 2);
    for (const key of toDrop) recentFingerprints.delete(key);
  }
  return true;
}

function fingerprint(event: FinancialNotificationEvent): string {
  return `${event.packageName}|${event.postedAt}|${event.title ?? ""}|${event.body ?? ""}`;
}

export type NotificationIngestAuditOutcome =
  | "statement_inserted"
  | "skipped_duplicate"
  | "skipped_wallet_bank_mirror"
  | "skipped_unknown_type"
  | "skipped_no_amount"
  | "skipped_no_account"
  | "skipped_validation"
  | "error";

export type NotificationIngestAuditEntry = {
  recordedAt: string;
  packageName: string;
  postedAt: string;
  title?: string;
  body?: string;
  direction: InferredNotificationDirection;
  amount: number | null;
  outcome: NotificationIngestAuditOutcome;
  detail?: string;
};

async function appendAudit(entry: NotificationIngestAuditEntry): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(AUDIT_LOG_KEY);
    const list: NotificationIngestAuditEntry[] = raw ? (JSON.parse(raw) as NotificationIngestAuditEntry[]) : [];
    list.unshift(entry);
    await AsyncStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(list.slice(0, 300)));
  } catch {
    // ignore storage failures
  }
}

export type RecordFinancialNotificationResult =
  | { outcome: "statement_inserted"; direction: "income" | "expense"; amount: number }
  | { outcome: "skipped_duplicate" }
  | { outcome: "skipped_wallet_bank_mirror" }
  | { outcome: "skipped_unknown_type" }
  | { outcome: "skipped_no_amount" }
  | { outcome: "skipped_no_account" }
  | { outcome: "skipped_validation"; message: string }
  | { outcome: "error"; message: string };

export async function recordFinancialNotificationFromIngest(
  event: FinancialNotificationEvent,
  options?: { onStatementInserted?: () => void },
): Promise<RecordFinancialNotificationResult> {
  const fp = fingerprint(event);
  if (!touchDedupe(fp)) {
    await appendAudit({
      recordedAt: new Date().toISOString(),
      packageName: event.packageName,
      postedAt: event.postedAt,
      title: event.title,
      body: event.body,
      direction: "unknown",
      amount: null,
      outcome: "skipped_duplicate",
    });
    return { outcome: "skipped_duplicate" };
  }

  const { direction, amount, combinedText } = inferNotificationFinancialSummary({
    title: event.title,
    body: event.body,
  });

  const baseAudit = (): Omit<NotificationIngestAuditEntry, "outcome" | "detail"> => ({
    recordedAt: new Date().toISOString(),
    packageName: event.packageName,
    postedAt: event.postedAt,
    title: event.title,
    body: event.body,
    direction,
    amount,
  });

  if (direction === "unknown") {
    await appendAudit({
      ...baseAudit(),
      outcome: "skipped_unknown_type",
      detail: combinedText.slice(0, 500),
    });
    return { outcome: "skipped_unknown_type" };
  }

  if (amount === null) {
    await appendAudit({
      ...baseAudit(),
      outcome: "skipped_no_amount",
      detail: combinedText.slice(0, 500),
    });
    return { outcome: "skipped_no_amount" };
  }

  try {
    const refs = await getTransactionReferences();
    const defaultAccount = refs.accounts[0];
    if (!defaultAccount) {
      await appendAudit({
        ...baseAudit(),
        outcome: "skipped_no_account",
      });
      return { outcome: "skipped_no_account" };
    }

    let category = refs.categories.filter((c) => c.type === direction).sort((a, b) => a.name.localeCompare(b.name))[0];
    if (!category) {
      category = await createQuickCategory(
        direction === "income" ? "Notificações (entrada)" : "Notificações (saída)",
        direction,
      );
    }

    const rawDescription = [event.title, event.body].filter(Boolean).join(" — ").trim() || "Notificação financeira";
    const description = rawDescription.slice(0, 220);
    const statementDate = new Date().toISOString().slice(0, 10);

    const parsed = transactionSchema.safeParse({
      description,
      amount,
      type: direction,
      status: "paid",
      account_id: defaultAccount.id,
      category_id: category.id,
      statement_date: statementDate,
      due_date: statementDate,
      installments: 1,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validação falhou";
      await appendAudit({
        ...baseAudit(),
        outcome: "skipped_validation",
        detail: message,
      });
      return { outcome: "skipped_validation", message };
    }

    const mirror = await shouldSkipAsWalletBankMirrorPayment({
      packageName: event.packageName,
      amount,
      direction,
    });
    if (mirror) {
      await appendAudit({
        ...baseAudit(),
        outcome: "skipped_wallet_bank_mirror",
        detail: "Mesmo valor e tipo que outro app (Wallet ou banco) nos últimos 20 min.",
      });
      return { outcome: "skipped_wallet_bank_mirror" };
    }

    await upsertTransaction(parsed.data);
    await recordPaymentSignalForWalletBankDedupe({
      at: new Date().toISOString(),
      amount,
      direction,
      packageName: event.packageName,
    });
    await appendAudit({
      ...baseAudit(),
      outcome: "statement_inserted",
    });
    options?.onStatementInserted?.();
    return { outcome: "statement_inserted", direction, amount };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await appendAudit({
      ...baseAudit(),
      outcome: "error",
      detail: message,
    });
    return { outcome: "error", message };
  }
}
