import type { QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import { formatCurrency } from "@finance-controller/shared";
import { armFinanceNotificationListenerIfPermitted } from "@/platform/notifications/arm-finance-notification-listener";
import { notificationIngest } from "@/platform/notifications";
import { recordFinancialNotificationFromIngest } from "@/platform/notifications/notification-statement-recorder";
import { useToast } from "@/providers/toast-provider";

type Options = {
  queryClient?: QueryClient;
};

/**
 * Subscribes to native notification listener events app-wide (Android + native module only).
 * Classifies PT-BR style bank copy as income/expense, parses BRL amount, inserts a statement when possible,
 * and keeps a local audit trail for skipped cases.
 */
export function useFinancialNotificationListener(options?: Options) {
  const { showToast } = useToast();
  const queryClient = options?.queryClient;

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const arm = () => {
      void armFinanceNotificationListenerIfPermitted();
    };

    arm();

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") arm();
    };
    const sub = AppState.addEventListener("change", onAppState);

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const available = await notificationIngest.isAvailable();
      if (cancelled || !available) return;
      unsubscribe = notificationIngest.onEvent((event) => {
        void recordFinancialNotificationFromIngest(event, {
          onStatementInserted: () => {
            queryClient?.invalidateQueries({ queryKey: ["transactions"] });
          },
        }).then((result) => {
          if (__DEV__) {
            console.log("[notification-ingest]", result.outcome, event);
          }
          if (result.outcome === "statement_inserted") {
            const label = result.direction === "income" ? "Entrada registrada" : "Saída registrada";
            showToast(`${label}: ${formatCurrency(result.amount)}`, "success");
          } else if (result.outcome === "error") {
            showToast(result.message, "error");
          } else if (result.outcome === "skipped_no_account") {
            showToast("Crie uma conta no app para registrar lançamentos a partir de notificações.", "info");
          } else if (result.outcome === "skipped_no_amount") {
            showToast("Notificação reconhecida, mas o valor em R$ não foi encontrado no texto.", "info");
          } else if (result.outcome === "skipped_unknown_type") {
            showToast("Notificação ignorada: não foi possível classificar como entrada ou saída.", "info");
          } else if (result.outcome === "skipped_validation") {
            showToast(`Notificação: validação falhou (${result.message})`, "error");
          } else if (result.outcome === "skipped_wallet_bank_mirror") {
            showToast("Mesmo pagamento já registrado (Wallet + banco nos últimos 20 min).", "info");
          } else if (result.outcome === "skipped_duplicate" && __DEV__) {
            showToast("Notificação duplicada (ignorada).", "info");
          }
        });
      });
    })();

    return () => {
      cancelled = true;
      sub.remove();
      unsubscribe?.();
    };
  }, [queryClient, showToast]);
}
