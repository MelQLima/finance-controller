import type { Statement } from "@finance-controller/shared";
import { getMonthBounds, getStatementDate, normalizeStatementDates } from "@finance-controller/shared";
import { supabase } from "@/lib/supabase";
import { getCurrentUserIdOrThrow } from "@/lib/user-session";

export async function getCalendarItems(month?: string) {
  const userId = await getCurrentUserIdOrThrow();
  const { start, end } = getMonthBounds(month);

  let { data, error } = await supabase
    .from("statements")
    .select("*")
    .eq("user_id", userId)
    .gte("transaction_date", start)
    .lte("transaction_date", end)
    .order("transaction_date", { ascending: true });

  if (error?.message.includes("transaction_date") || error?.message.includes("statement_date")) {
    const fallback = await supabase.from("statements").select("*").eq("user_id", userId).order("created_at", { ascending: true });
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
