import { format } from "date-fns";
import type { Statement } from "@finance-controller/shared";
import { getMonthBounds, getStatementDate, normalizeStatementDates } from "@finance-controller/shared";
import { fetchMergedMonthlyForecasts } from "@/features/forecast/merged-monthly-forecasts";
import { supabase } from "@/lib/supabase";
import { getCurrentUserIdOrThrow } from "@/lib/user-session";

export async function getDashboardData(month = format(new Date(), "yyyy-MM")) {
  const userId = await getCurrentUserIdOrThrow();
  const { start, end } = getMonthBounds(month);

  const [statementsResult, mergedForecasts] = await Promise.all([
    supabase
      .from("statements")
      .select("*")
      .eq("user_id", userId)
      .gte("transaction_date", start)
      .lte("transaction_date", end),
    fetchMergedMonthlyForecasts(),
  ]);

  let statements = statementsResult.data;
  if (
    statementsResult.error?.message.includes("transaction_date") ||
    statementsResult.error?.message.includes("statement_date")
  ) {
    const fallback = await supabase.from("statements").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (fallback.error) throw new Error(fallback.error.message);
    statements = fallback.data;
  } else if (statementsResult.error) {
    throw new Error(statementsResult.error.message);
  }

  const transactionList = normalizeStatementDates((statements ?? []) as Record<string, unknown>[])
    .filter((item) => {
      const date = getStatementDate(item);
      return date >= start && date <= end;
    })
    .sort((a, b) => getStatementDate(b).localeCompare(getStatementDate(a))) as unknown as Statement[];

  const totals = transactionList.reduce(
    (acc, item) => {
      if (item.type === "income") acc.income += item.amount;
      if (item.type === "expense") acc.expense += item.amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );

  return {
    month,
    currentBalance: totals.income - totals.expense,
    income: totals.income,
    expense: totals.expense,
    recentTransactions: transactionList.slice(0, 10),
    evolutionSeries: mergedForecasts.slice(0, 6).map((item) => ({
      month: item.month,
      income: item.projected_income,
      expense: item.projected_expense,
      balance: item.projected_balance,
    })),
  };
}
