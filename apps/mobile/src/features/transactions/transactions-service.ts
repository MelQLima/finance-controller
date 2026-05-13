import type { Account, Category, Statement, StatementType, TransactionSchema } from "@finance-controller/shared";
import { basicCategoriesByType, getMonthBounds, getStatementDate, normalizeStatementDates, quickNameSchema } from "@finance-controller/shared";
import { addMonths, format, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";

export interface TransactionFilters {
  month?: string;
  categoryId?: string;
  accountId?: string;
  type?: "income" | "expense";
  status?: "paid" | "pending" | "scheduled";
}

function shouldTryAlternateDateColumns(message?: string) {
  return !!message && (message.includes("transaction_date") || message.includes("statement_date"));
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Data da parcela `monthOffset` (0 = primeira), com meses corretos em fins de mês (ex.: 31 jan → 28 fev). */
function toIsoDateFromMonthOffset(baseDateIso: string, monthOffset: number): string {
  const day = baseDateIso.slice(0, 10);
  const base = parseISO(day);
  if (Number.isNaN(base.getTime())) return day;
  return format(addMonths(base, monthOffset), "yyyy-MM-dd");
}

/** UUID v4 válido quando `Math.random()` é a única fonte (sem Web Crypto). */
function uuidV4FromMathRandom(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** UUID v4 para `installment_group_id` quando a coluna no banco é tipo `uuid`. */
function newInstallmentGroupUuid(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  if (typeof c?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
    bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
    const h = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  return uuidV4FromMathRandom();
}

/** Reparte o total em `count` parcelas; centavos vão para a última para fechar o total. */
function splitInstallmentAmounts(total: number, count: number): number[] {
  if (count <= 1) return [roundMoney(total)];
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const cents = base + (i === count - 1 ? remainder : 0);
    out.push(cents / 100);
  }
  return out;
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

export async function getTransactions(filters: TransactionFilters = {}) {
  const userId = await getUserIdOrThrow();
  const { start, end } = getMonthBounds(filters.month);

  let query = supabase
    .from("statements")
    .select("*")
    .eq("user_id", userId)
    .gte("transaction_date", start)
    .lte("transaction_date", end)
    .order("transaction_date", { ascending: false });

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.accountId) query = query.eq("account_id", filters.accountId);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.status) query = query.eq("status", filters.status);

  let { data, error } = await query;

  if (error?.message.includes("transaction_date") || error?.message.includes("statement_date")) {
    let fallback = supabase.from("statements").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (filters.categoryId) fallback = fallback.eq("category_id", filters.categoryId);
    if (filters.accountId) fallback = fallback.eq("account_id", filters.accountId);
    if (filters.type) fallback = fallback.eq("type", filters.type);
    if (filters.status) fallback = fallback.eq("status", filters.status);

    const result = await fallback;
    data = result.data;
    error = result.error;
  }

  if (error) throw new Error(error.message);

  const normalized = normalizeStatementDates((data ?? []) as Record<string, unknown>[]);
  return normalized
    .filter((item) => {
      const date = getStatementDate(item);
      return date >= start && date <= end;
    })
    .sort((a, b) => getStatementDate(b).localeCompare(getStatementDate(a))) as unknown as Statement[];
}

export async function getTransactionById(id: string) {
  const userId = await getUserIdOrThrow();
  const { data, error } = await supabase.from("statements").select("*").eq("user_id", userId).eq("id", id).single();
  if (error || !data) return null;
  return normalizeStatementDates([data as Record<string, unknown>])[0] as unknown as Statement;
}

export async function getTransactionReferences() {
  const userId = await getUserIdOrThrow();

  const [accountsResult, categoriesResult] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", userId).order("name", { ascending: true }),
    supabase.from("categories").select("*").eq("user_id", userId).order("name", { ascending: true }),
  ]);

  if (accountsResult.error) throw new Error(accountsResult.error.message);
  if (categoriesResult.error) throw new Error(categoriesResult.error.message);

  return {
    accounts: (accountsResult.data ?? []) as Account[],
    categories: (categoriesResult.data ?? []) as Category[],
  };
}

export async function upsertTransaction(payload: TransactionSchema) {
  const userId = await getUserIdOrThrow();

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
        transaction_date: payload.statement_date,
        due_date: payload.due_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id)
      .eq("user_id", userId);

    if (shouldTryAlternateDateColumns(error?.message)) {
      const primaryError = error;
      let fallback = await supabase
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
        .eq("user_id", userId);

      if (fallback.error?.message.includes("statement_date")) {
        fallback = await supabase
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
          .eq("user_id", userId);
      }

      if (!fallback.error) {
        error = null;
      } else {
        error = fallback.error.message.includes("'date'") ? primaryError : fallback.error;
      }
    }

    if (error) throw new Error(error.message);
    return;
  }

  const totalInstallments = Math.min(60, Math.max(1, Math.floor(payload.installments)));
  const installmentGroupId = totalInstallments > 1 ? newInstallmentGroupUuid() : null;
  const amounts = splitInstallmentAmounts(payload.amount, totalInstallments);

  const rows = Array.from({ length: totalInstallments }).map((_, index) => {
    const statementDate = toIsoDateFromMonthOffset(payload.statement_date, index);
    const amount = amounts[index] ?? payload.amount;
    return {
      user_id: userId,
      description: totalInstallments > 1 ? `${payload.description} (${index + 1}/${totalInstallments})` : payload.description,
      amount,
      type: payload.type,
      status: index === 0 ? payload.status : "scheduled",
      account_id: payload.account_id,
      category_id: payload.category_id,
      transaction_date: statementDate,
      due_date: payload.due_date || statementDate,
      installment_group_id: installmentGroupId,
      installment_number: totalInstallments > 1 ? index + 1 : null,
      installment_total: totalInstallments > 1 ? totalInstallments : null,
    };
  });

  let { error } = await supabase.from("statements").insert(rows);

  if (shouldTryAlternateDateColumns(error?.message)) {
    const primaryError = error;

    const fallbackRows = rows.map(({ transaction_date, ...item }) => ({
      ...item,
      statement_date: transaction_date,
    }));
    let fallback = await supabase.from("statements").insert(fallbackRows);

    if (fallback.error?.message.includes("statement_date")) {
      const dateRows = rows.map(({ transaction_date, ...item }) => ({
        ...item,
        date: transaction_date,
      }));
      fallback = await supabase.from("statements").insert(dateRows as never);
    }

    if (!fallback.error) {
      error = null;
    } else {
      error = fallback.error.message.includes("'date'") ? primaryError : fallback.error;
    }
  }

  if (error) throw new Error(error.message);
}

export async function deleteTransaction(id: string) {
  const userId = await getUserIdOrThrow();
  const { error } = await supabase.from("statements").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function createQuickAccount(name: string) {
  const userId = await getUserIdOrThrow();
  const parsedName = quickNameSchema.safeParse(name);
  if (!parsedName.success) throw new Error(parsedName.error.issues[0]?.message ?? "Nome inválido");

  let { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: parsedName.data,
      type: "checking",
      initial_balance: 0,
      current_balance: 0,
    })
    .select("*")
    .single();

  if (error?.message.includes("current_balance")) {
    const fallback = await supabase
      .from("accounts")
      .insert({
        user_id: userId,
        name: parsedName.data,
        type: "checking",
        initial_balance: 0,
      })
      .select("*")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) throw new Error(error?.message ?? "Não foi possível criar a conta");
  return data as Account;
}

export async function createQuickCategory(name: string, type: StatementType) {
  const userId = await getUserIdOrThrow();
  const parsedName = quickNameSchema.safeParse(name);
  if (!parsedName.success) throw new Error(parsedName.error.issues[0]?.message ?? "Nome inválido");

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: parsedName.data,
      type,
      color: "#64748b",
      icon: null,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Não foi possível criar categoria");
  return data as Category;
}

export async function createBasicCategories(type: StatementType) {
  const userId = await getUserIdOrThrow();
  const baseNames = basicCategoriesByType[type] ?? [];

  const { data: existingRows, error: existingError } = await supabase
    .from("categories")
    .select("name")
    .eq("user_id", userId)
    .eq("type", type);

  if (existingError) throw new Error(existingError.message);

  const existingNames = new Set((existingRows ?? []).map((item) => item.name.trim().toLowerCase()));
  const namesToCreate = baseNames.filter((name) => !existingNames.has(name.toLowerCase()));
  if (!namesToCreate.length) return [] as Category[];

  const { data, error } = await supabase
    .from("categories")
    .insert(
      namesToCreate.map((name) => ({
        user_id: userId,
        name,
        type,
        color: "#64748b",
        icon: null,
      })),
    )
    .select("*");

  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}
