import type { MonthlyForecast, Statement } from "@/types";
import { normalizeStatementDates } from "@/utils/statement-date";
import { getCurrentUser, getSupabaseForUser } from "@/services/session";

export async function getForecastData() {
  const user = await getCurrentUser();
  const supabase = await getSupabaseForUser();

  const [{ data: monthlyForecasts }, scheduledResult] = await Promise.all([
    supabase
      .from("monthly_forecasts")
      .select("*")
      .eq("user_id", user.id)
      .order("month", { ascending: true }),
    supabase
      .from("statements")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["pending", "scheduled"])
      .order("statement_date", { ascending: true }),
  ]);

  let scheduledStatements = scheduledResult.data;
  if (scheduledResult.error?.message.includes("statement_date")) {
    const fallback = await supabase
      .from("statements")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["pending", "scheduled"])
      .order("created_at", { ascending: true });
    if (fallback.error) {
      throw new Error(fallback.error.message);
    }
    scheduledStatements = fallback.data;
  } else if (scheduledResult.error) {
    throw new Error(scheduledResult.error.message);
  }

  return {
    monthlyForecasts: (monthlyForecasts ?? []) as MonthlyForecast[],
    scheduledStatements: normalizeStatementDates(
      (scheduledStatements ?? []) as Record<string, unknown>[],
    )
      .slice(0, 20) as unknown as Statement[],
  };
}
