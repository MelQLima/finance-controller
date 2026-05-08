import type { Statement } from "@/types";
import { getMonthBounds } from "@/utils/date";
import { getStatementDate, normalizeStatementDates } from "@/utils/statement-date";
import { getCurrentUser, getSupabaseForUser } from "@/services/session";

export interface TransactionFilters {
  month?: string;
  categoryId?: string;
  accountId?: string;
  type?: "income" | "expense";
  status?: "paid" | "pending" | "scheduled";
}

export async function getTransactions(filters: TransactionFilters = {}) {
  const user = await getCurrentUser();
  const supabase = await getSupabaseForUser();
  const { start, end } = getMonthBounds(filters.month);

  const baseQuery = supabase
    .from("statements")
    .select("*")
    .eq("user_id", user.id)
    .gte("statement_date", start)
    .lte("statement_date", end)
    .order("statement_date", { ascending: false });

  let query = baseQuery;
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.accountId) query = query.eq("account_id", filters.accountId);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.status) query = query.eq("status", filters.status);

  let { data, error } = await query;
  if (error?.message.includes("statement_date")) {
    let fallback = supabase
      .from("statements")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (filters.categoryId) fallback = fallback.eq("category_id", filters.categoryId);
    if (filters.accountId) fallback = fallback.eq("account_id", filters.accountId);
    if (filters.type) fallback = fallback.eq("type", filters.type);
    if (filters.status) fallback = fallback.eq("status", filters.status);
    const result = await fallback;
    data = result.data;
    error = result.error;
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
    .sort((a, b) => getStatementDate(b).localeCompare(getStatementDate(a))) as unknown as Statement[];
}

export async function getTransactionById(id: string) {
  const user = await getCurrentUser();
  const supabase = await getSupabaseForUser();
  const { data, error } = await supabase
    .from("statements")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Statement;
}
