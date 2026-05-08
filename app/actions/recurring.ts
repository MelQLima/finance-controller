"use server";

import { addMonths, format } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/result";
import { recurringItemSchema } from "@/types";
import { getCurrentUser } from "@/services/session";

export async function createRecurringItemAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = recurringItemSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    account_id: formData.get("account_id"),
    category_id: formData.get("category_id"),
    day_of_month: formData.get("day_of_month"),
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid recurring item." };
  }

  const user = await getCurrentUser();
  const supabase = await createClient();

  let { data, error } = await supabase
    .from("recurring_items")
    .insert({
      user_id: user.id,
      ...parsed.data,
      ends_at: parsed.data.ends_at || null,
      active: true,
    })
    .select("id")
    .single();

  // Backward-compatible insert when schema has no "active" column.
  if (error?.message.includes("active")) {
    const fallback = await supabase
      .from("recurring_items")
      .insert({
        user_id: user.id,
        ...parsed.data,
        ends_at: parsed.data.ends_at || null,
      })
      .select("id")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error?.message.includes("day_of_month")) {
    const fallback = await supabase
      .from("recurring_items")
      .insert({
        user_id: user.id,
        description: parsed.data.description,
        amount: parsed.data.amount,
        type: parsed.data.type,
        account_id: parsed.data.account_id,
        category_id: parsed.data.category_id,
        starts_at: parsed.data.starts_at,
        ends_at: parsed.data.ends_at || null,
      })
      .select("id")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return { success: false, message: error?.message ?? "Unable to create recurring item." };
  }

  const statements = Array.from({ length: 6 }).map((_, index) => {
    const dueDate = format(addMonths(new Date(parsed.data.starts_at), index), "yyyy-MM-dd");
    return {
      user_id: user.id,
      description: parsed.data.description,
      amount: parsed.data.amount,
      type: parsed.data.type,
      status: "scheduled",
      account_id: parsed.data.account_id,
      category_id: parsed.data.category_id,
      statement_date: dueDate,
      due_date: dueDate,
      recurring_item_id: data.id,
    };
  });

  let insertResult = await supabase.from("statements").insert(statements);
  if (insertResult.error?.message.includes("statement_date")) {
    const fallbackStatements = statements.map(({ statement_date, ...item }) => ({
      ...item,
      date: statement_date,
    }));
    insertResult = await supabase.from("statements").insert(fallbackStatements);
  }

  if (insertResult.error) {
    return { success: false, message: insertResult.error.message };
  }

  revalidatePath("/forecast");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true, message: "Recurring item created with 6 future entries." };
}
