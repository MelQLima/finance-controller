import type { Account, Category } from "@/types";
import { getCurrentUser, getSupabaseForUser } from "@/services/session";

export async function getReferenceData() {
  const user = await getCurrentUser();
  const supabase = await getSupabaseForUser();

  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  return {
    accounts: (accounts ?? []) as Account[],
    categories: (categories ?? []) as Category[],
  };
}
