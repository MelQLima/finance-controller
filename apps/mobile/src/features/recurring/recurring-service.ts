import type { RecurringItem, RecurringItemSchema } from "@finance-controller/shared";
import { buildOccurrenceDates, isRecurringItemActive } from "@finance-controller/shared";
import { supabase } from "@/lib/supabase";
import { getTransactionReferences } from "@/features/transactions/transactions-service";

function shouldTryAlternateDateColumns(message?: string) {
  return !!message && (message.includes("transaction_date") || message.includes("statement_date"));
}

async function getUserIdOrThrow() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(userError?.message ?? "Usuário não autenticado");
  }

  return user.id;
}

function scheduleColumns(payload: RecurringItemSchema) {
  return {
    frequency: payload.schedule_preset,
    interval_months: payload.schedule_preset === "custom" ? (payload.interval_months ?? 1) : null,
    day_of_week: payload.schedule_preset === "weekly" ? (payload.day_of_week ?? null) : null,
  };
}

export { getTransactionReferences as getRecurringReferences };

export async function getRecurringItems() {
  const userId = await getUserIdOrThrow();

  let { data, error } = await supabase
    .from("recurring_items")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("day_of_month", { ascending: true });

  if (error?.message.includes("active") || error?.message.includes("day_of_month")) {
    const fallback = await supabase.from("recurring_items").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as RecurringItem[];
  return rows.filter(isRecurringItemActive);
}

export async function getRecurringItemById(id: string) {
  const userId = await getUserIdOrThrow();
  const { data, error } = await supabase.from("recurring_items").select("*").eq("id", id).eq("user_id", userId).single();
  if (error || !data) return null;
  return data as RecurringItem;
}

export async function upsertRecurringItem(payload: RecurringItemSchema, recurringId?: string) {
  const userId = await getUserIdOrThrow();
  const sch = scheduleColumns(payload);

  if (recurringId) {
    let { error } = await supabase
      .from("recurring_items")
      .update({
        description: payload.description,
        amount: payload.amount,
        type: payload.type,
        account_id: payload.account_id,
        category_id: payload.category_id,
        due_day: payload.day_of_month,
        start_date: payload.starts_at,
        end_date: payload.ends_at || null,
        is_active: true,
        ...sch,
      })
      .eq("id", recurringId)
      .eq("user_id", userId);

    if (
      error?.message.includes("due_day") ||
      error?.message.includes("start_date") ||
      error?.message.includes("is_active") ||
      error?.message.includes("active")
    ) {
      const fallback = await supabase
        .from("recurring_items")
        .update({
          description: payload.description,
          amount: payload.amount,
          type: payload.type,
          account_id: payload.account_id,
          category_id: payload.category_id,
          day_of_month: payload.day_of_month,
          starts_at: payload.starts_at,
          ends_at: payload.ends_at || null,
          frequency: sch.frequency,
          interval_months: sch.interval_months,
          day_of_week: sch.day_of_week,
        })
        .eq("id", recurringId)
        .eq("user_id", userId);
      error = fallback.error;
    }

    if (error?.message.includes("ends_at") || error?.message.includes("starts_at")) {
      const legacyDates = await supabase
        .from("recurring_items")
        .update({
          description: payload.description,
          amount: payload.amount,
          type: payload.type,
          account_id: payload.account_id,
          category_id: payload.category_id,
          day_of_month: payload.day_of_month,
          start_date: payload.starts_at,
          end_date: payload.ends_at || null,
          frequency: sch.frequency,
          interval_months: sch.interval_months,
          day_of_week: sch.day_of_week,
        })
        .eq("id", recurringId)
        .eq("user_id", userId);
      error = legacyDates.error;
    }

    if (error?.message.includes("frequency") || error?.message.includes("interval_months") || error?.message.includes("day_of_week")) {
      const fallback = await supabase
        .from("recurring_items")
        .update({
          description: payload.description,
          amount: payload.amount,
          type: payload.type,
          account_id: payload.account_id,
          category_id: payload.category_id,
          day_of_month: payload.day_of_month,
          starts_at: payload.starts_at,
          ends_at: payload.ends_at || null,
        })
        .eq("id", recurringId)
        .eq("user_id", userId);
      error = fallback.error;
    }

    if (error?.message.includes("ends_at") || error?.message.includes("starts_at")) {
      const legacyDates = await supabase
        .from("recurring_items")
        .update({
          description: payload.description,
          amount: payload.amount,
          type: payload.type,
          account_id: payload.account_id,
          category_id: payload.category_id,
          day_of_month: payload.day_of_month,
          start_date: payload.starts_at,
          end_date: payload.ends_at || null,
        })
        .eq("id", recurringId)
        .eq("user_id", userId);
      error = legacyDates.error;
    }

    if (error?.message.includes("day_of_month")) {
      const fallback = await supabase
        .from("recurring_items")
        .update({
          description: payload.description,
          amount: payload.amount,
          type: payload.type,
          account_id: payload.account_id,
          category_id: payload.category_id,
          starts_at: payload.starts_at,
          ends_at: payload.ends_at || null,
        })
        .eq("id", recurringId)
        .eq("user_id", userId);
      error = fallback.error;
    }

    if (error?.message.includes("ends_at") || error?.message.includes("starts_at")) {
      const legacyDates = await supabase
        .from("recurring_items")
        .update({
          description: payload.description,
          amount: payload.amount,
          type: payload.type,
          account_id: payload.account_id,
          category_id: payload.category_id,
          start_date: payload.starts_at,
          end_date: payload.ends_at || null,
        })
        .eq("id", recurringId)
        .eq("user_id", userId);
      error = legacyDates.error;
    }

    if (error) throw new Error(error.message);
    return;
  }

  const baseInsert = {
    user_id: userId,
    description: payload.description,
    amount: payload.amount,
    type: payload.type,
    account_id: payload.account_id,
    category_id: payload.category_id,
    start_date: payload.starts_at,
    end_date: payload.ends_at || null,
    due_day: payload.day_of_month,
    auto_generate: true,
    is_active: true,
    ...sch,
  };

  let { data, error } = await supabase.from("recurring_items").insert(baseInsert).select("id").single();

  if (error?.message.includes("frequency") || error?.message.includes("interval_months") || error?.message.includes("day_of_week")) {
    const fallback = await supabase
      .from("recurring_items")
      .insert({
        user_id: userId,
        description: payload.description,
        amount: payload.amount,
        type: payload.type,
        account_id: payload.account_id,
        category_id: payload.category_id,
        frequency: "monthly",
        start_date: payload.starts_at,
        end_date: payload.ends_at || null,
        due_day: payload.day_of_month,
        auto_generate: true,
        is_active: true,
      })
      .select("id")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error?.message.includes("frequency") || error?.message.includes("start_date") || error?.message.includes("is_active")) {
    const fallback = await supabase
      .from("recurring_items")
      .insert({
        user_id: userId,
        description: payload.description,
        amount: payload.amount,
        type: payload.type,
        account_id: payload.account_id,
        category_id: payload.category_id,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at || null,
      })
      .select("id")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error?.message.includes("ends_at") || error?.message.includes("starts_at")) {
    const legacyInsert = await supabase
      .from("recurring_items")
      .insert({
        user_id: userId,
        description: payload.description,
        amount: payload.amount,
        type: payload.type,
        account_id: payload.account_id,
        category_id: payload.category_id,
        start_date: payload.starts_at,
        end_date: payload.ends_at || null,
      })
      .select("id")
      .single();
    data = legacyInsert.data;
    error = legacyInsert.error;
  }

  if (error?.message.includes("day_of_month")) {
    const fallback = await supabase
      .from("recurring_items")
      .insert({
        user_id: userId,
        description: payload.description,
        amount: payload.amount,
        type: payload.type,
        account_id: payload.account_id,
        category_id: payload.category_id,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at || null,
      })
      .select("id")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error?.message.includes("ends_at") || error?.message.includes("starts_at")) {
    const legacyInsert = await supabase
      .from("recurring_items")
      .insert({
        user_id: userId,
        description: payload.description,
        amount: payload.amount,
        type: payload.type,
        account_id: payload.account_id,
        category_id: payload.category_id,
        start_date: payload.starts_at,
        end_date: payload.ends_at || null,
      })
      .select("id")
      .single();
    data = legacyInsert.data;
    error = legacyInsert.error;
  }

  if (error || !data) throw new Error(error?.message ?? "Não foi possível criar a recorrência");

  const dueDates = buildOccurrenceDates(payload.starts_at, payload.schedule_preset, {
    dayOfMonth: payload.day_of_month,
    intervalMonths: payload.interval_months,
    dayOfWeek: payload.day_of_week,
  }, 6);

  const statements = dueDates.map((dueDate) => ({
    user_id: userId,
    description: payload.description,
    amount: payload.amount,
    type: payload.type,
    status: "scheduled" as const,
    account_id: payload.account_id,
    category_id: payload.category_id,
    transaction_date: dueDate,
    due_date: dueDate,
    recurring_item_id: data.id,
  }));

  const insertResult = await supabase.from("statements").insert(statements);
  let insertError = insertResult.error;
  if (shouldTryAlternateDateColumns(insertError?.message)) {
    const primaryError = insertError;
    let fallbackStatements = statements.map(({ transaction_date, ...item }) => ({
      ...item,
      statement_date: transaction_date,
    }));
    let fallback = await supabase.from("statements").insert(fallbackStatements);
    if (fallback.error?.message.includes("statement_date")) {
      const dateRows = statements.map(({ transaction_date, ...item }) => ({
        ...item,
        date: transaction_date,
      }));
      fallback = await supabase.from("statements").insert(dateRows as never);
    }
    if (!fallback.error) {
      insertError = null;
    } else {
      insertError = fallback.error.message.includes("'date'") ? primaryError : fallback.error;
    }
  }

  if (insertError) throw new Error(insertError.message);
}

export async function deleteRecurringItem(id: string) {
  const userId = await getUserIdOrThrow();
  const { error } = await supabase.from("recurring_items").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
}
