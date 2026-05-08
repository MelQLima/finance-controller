"use server";

import { addMonths, format } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/result";
import { transactionSchema } from "@/types";
import { getCurrentUser } from "@/services/session";

export async function upsertTransactionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = transactionSchema.safeParse({
    id: formData.get("id") || undefined,
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    status: formData.get("status"),
    account_id: formData.get("account_id"),
    category_id: formData.get("category_id"),
    statement_date: formData.get("statement_date"),
    due_date: formData.get("due_date") || undefined,
    installments: formData.get("installments"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid transaction data." };
  }

  const user = await getCurrentUser();
  const supabase = await createClient();
  const payload = parsed.data;

  if (payload.id) {
    let { error } = await supabase
      .from("statements")
      .update({
        description: payload.description,
        amount: payload.amount,
        type: payload.type,
        status: payload.status,
        account_id: payload.account_id,
        category_id: payload.category_id,
        statement_date: payload.statement_date,
        due_date: payload.due_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id)
      .eq("user_id", user.id);

    if (error?.message.includes("statement_date")) {
      const fallback = await supabase
        .from("statements")
        .update({
          description: payload.description,
          amount: payload.amount,
          type: payload.type,
          status: payload.status,
          account_id: payload.account_id,
          category_id: payload.category_id,
          date: payload.statement_date,
          due_date: payload.due_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.id)
        .eq("user_id", user.id);
      error = fallback.error;
    }

    if (error) return { success: false, message: error.message };
  } else {
    const totalInstallments = payload.installments;
    const installmentGroupId =
      totalInstallments > 1 ? `${user.id}-${Date.now()}-${Math.random().toString(16).slice(2)}` : null;

    const records = Array.from({ length: totalInstallments }).map((_, index) => {
      const statementDate = format(addMonths(new Date(payload.statement_date), index), "yyyy-MM-dd");
      return {
        user_id: user.id,
        description:
          totalInstallments > 1
            ? `${payload.description} (${index + 1}/${totalInstallments})`
            : payload.description,
        amount: payload.amount,
        type: payload.type,
        status: index === 0 ? payload.status : "scheduled",
        account_id: payload.account_id,
        category_id: payload.category_id,
        statement_date: statementDate,
        due_date: payload.due_date || statementDate,
        installment_group_id: installmentGroupId,
        installment_number: totalInstallments > 1 ? index + 1 : null,
        installment_total: totalInstallments > 1 ? totalInstallments : null,
      };
    });

    let { error } = await supabase.from("statements").insert(records);
    if (error?.message.includes("statement_date")) {
      const fallbackRecords = records.map(({ statement_date, ...item }) => ({
        ...item,
        date: statement_date,
      }));
      const fallback = await supabase.from("statements").insert(fallbackRecords);
      error = fallback.error;
    }
    if (error) return { success: false, message: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/calendar");
  revalidatePath("/forecast");
  return { success: true, message: "Transaction saved successfully." };
}

export async function deleteTransactionAction(id: string): Promise<ActionState> {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { error } = await supabase.from("statements").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/calendar");
  revalidatePath("/forecast");
  return { success: true, message: "Transaction removed." };
}
