import { format } from "date-fns";
import type { Statement } from "@/types";
import { getMonthBounds } from "@/utils/date";
import { getStatementDate, normalizeStatementDates } from "@/utils/statement-date";
import { getCurrentUser, getSupabaseForUser } from "@/services/session";

export async function getDashboardData(month = format(new Date(), "yyyy-MM")) {
  const user = await getCurrentUser();
  const supabase = await getSupabaseForUser();
  const { start, end } = getMonthBounds(month);

  const [statementsResult, { data: monthlyForecasts }] = await Promise.all([
    supabase
      .from("statements")
      .select("*")
      .eq("user_id", user.id)
      .gte("statement_date", start)
      .lte("statement_date", end),
    supabase
      .from("monthly_forecasts")
      .select("*")
      .eq("user_id", user.id)
      .order("month", { ascending: true })
      .limit(6),
  ]);

  let statements = statementsResult.data;
  if (statementsResult.error?.message.includes("statement_date")) {
    const fallback = await supabase
      .from("statements")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (fallback.error) {
      throw new Error(fallback.error.message);
    }
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

  const byCategory = transactionList
    .filter((item) => item.type === "expense")
    .reduce(
      (acc, item) => {
        acc[item.category_id] = (acc[item.category_id] ?? 0) + item.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

  return {
    month,
    currentBalance: totals.income - totals.expense,
    income: totals.income,
    expense: totals.expense,
    recentTransactions: transactionList.slice(0, 10),
    categorySeries: Object.entries(byCategory).map(([categoryId, amount]) => ({
      categoryId,
      amount,
    })),
    evolutionSeries: (monthlyForecasts ?? []).map((item) => ({
      month: item.month,
      income: item.projected_income,
      expense: item.projected_expense,
      balance: item.projected_balance,
    })),
  };
}
