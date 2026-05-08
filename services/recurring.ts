import type { RecurringItem } from "@/types";
import { getCurrentUser, getSupabaseForUser } from "@/services/session";

export async function getRecurringItems() {
  const user = await getCurrentUser();
  const supabase = await getSupabaseForUser();

  let { data, error } = await supabase
    .from("recurring_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("day_of_month", { ascending: true });

  // Some schemas do not include "active" and/or "day_of_month" columns.
  if (
    error?.message.includes("active") ||
    error?.message.includes("day_of_month")
  ) {
    const fallback = await supabase
      .from("recurring_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RecurringItem[];
}
