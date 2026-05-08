import type { Statement } from "@/types";
import { getMonthBounds } from "@/utils/date";
import { getStatementDate, normalizeStatementDates } from "@/utils/statement-date";
import { getCurrentUser, getSupabaseForUser } from "@/services/session";

export async function getCalendarItems(month?: string) {
  const user = await getCurrentUser();
  const supabase = await getSupabaseForUser();
  const { start, end } = getMonthBounds(month);

  let { data, error } = await supabase
    .from("statements")
    .select("*")
    .eq("user_id", user.id)
    .gte("statement_date", start)
    .lte("statement_date", end)
    .order("statement_date", { ascending: true });

  if (error?.message.includes("statement_date")) {
    const fallback = await supabase
      .from("statements")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  const normalized = normalizeStatementDates((data ?? []) as Record<string, unknown>[]);
  return normalized
    .filter((item) => {
      const date = getStatementDate(item);
      return date >= start && date <= end;
    })
    .sort((a, b) => getStatementDate(a).localeCompare(getStatementDate(b))) as unknown as Statement[];
}
