import { endOfMonth, format, parseISO } from "date-fns";
import type { MonthlyCashPlanRow, MonthlyForecast, RecurringItem } from "@finance-controller/shared";
import { buildMonthlyCashPlan, getStatementDate, monthlyCashPlanToForecasts } from "@finance-controller/shared";
import { getInvestPercent } from "@/lib/invest-percent-setting";
import { getRecurringItems } from "@/features/recurring/recurring-service";
import { supabase } from "@/lib/supabase";
import { getCurrentUserIdOrThrow } from "@/lib/user-session";

function monthsFromNow(count: number): string[] {
  const base = new Date();
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    out.push(format(d, "yyyy-MM"));
  }
  return out;
}

async function fetchPendingScheduledStatements(userId: string): Promise<Record<string, unknown>[]> {
  let { data, error } = await supabase
    .from("statements")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "scheduled"])
    .order("transaction_date", { ascending: true });

  if (error?.message.includes("transaction_date") || error?.message.includes("statement_date")) {
    const fb = await supabase
      .from("statements")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["pending", "scheduled"])
      .order("created_at", { ascending: true });
    data = fb.data;
    error = fb.error;
  }
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

async function fetchPaidStatementsInWindow(
  userId: string,
  firstYm: string,
  lastYm: string,
): Promise<Record<string, unknown>[]> {
  const minD = `${firstYm}-01`;
  const maxD = format(endOfMonth(parseISO(`${lastYm}-01`)), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("statements")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "paid")
    .gte("statement_date", minD)
    .lte("statement_date", maxD)
    .order("statement_date", { ascending: true });

  if (error?.message.includes("statement_date") || error?.message.includes("transaction_date")) {
    const fb = await supabase
      .from("statements")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "paid")
      .order("created_at", { ascending: false });
    if (fb.error) throw new Error(fb.error.message);
    const filtered = (fb.data ?? []).filter((row) => {
      const d = getStatementDate(row);
      return d.length >= 10 && d.slice(0, 10) >= minD && d.slice(0, 10) <= maxD;
    });
    return filtered as Record<string, unknown>[];
  }
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

export type ForecastPlanContext = {
  forecasts: MonthlyForecast[];
  plan: MonthlyCashPlanRow[];
  investPercent: number;
  pendingStatements: Record<string, unknown>[];
};

export async function loadForecastPlanContext(): Promise<ForecastPlanContext> {
  const userId = await getCurrentUserIdOrThrow();
  const sortedMonths = monthsFromNow(24);
  const firstYm = sortedMonths[0];
  const lastYm = sortedMonths[sortedMonths.length - 1];
  if (!firstYm || !lastYm) {
    return { forecasts: [], plan: [], investPercent: 0, pendingStatements: [] };
  }

  const [accountsResult, recurring, investPct, pendingStatements, paidInWindow] = await Promise.all([
    supabase.from("accounts").select("current_balance").eq("user_id", userId),
    getRecurringItems(),
    getInvestPercent(),
    fetchPendingScheduledStatements(userId),
    fetchPaidStatementsInWindow(userId, firstYm, lastYm),
  ]);

  const startingBalance = accountsResult.error
    ? 0
    : (accountsResult.data ?? []).reduce((sum, row) => sum + (Number(row.current_balance) || 0), 0);

  const statements = [...pendingStatements, ...paidInWindow];
  const plan = buildMonthlyCashPlan({
    sortedMonths,
    startingBalance,
    recurring: recurring as RecurringItem[],
    statements,
    investPercentOfFree: investPct,
  });
  const forecasts = monthlyCashPlanToForecasts(plan, userId);

  return { forecasts, plan, investPercent: investPct, pendingStatements };
}

export async function fetchMergedMonthlyForecasts(): Promise<MonthlyForecast[]> {
  const { forecasts } = await loadForecastPlanContext();
  return forecasts;
}
