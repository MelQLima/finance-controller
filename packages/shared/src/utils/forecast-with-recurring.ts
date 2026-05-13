import { differenceInCalendarDays, endOfMonth, format, parseISO } from "date-fns";
import type { MonthlyForecast, RecurringItem } from "../types/database";
import { buildOccurrenceDates, inferScheduleFromRow, type RecurringSchedulePreset } from "./recurring-schedule";

export type RecurringForecastInput = Pick<RecurringItem, "amount" | "type"> &
  Partial<
    Pick<
      RecurringItem,
      | "id"
      | "description"
      | "starts_at"
      | "ends_at"
      | "day_of_month"
      | "frequency"
      | "interval_months"
      | "day_of_week"
      | "active"
    >
  > & {
    start_date?: string | null;
    end_date?: string | null;
    due_day?: number | null;
    is_active?: boolean | null;
  };

function parseYm(month: string): { y: number; m: number } {
  const [ys, ms] = month.split("-").map(Number);
  return { y: ys || 0, m: ms || 1 };
}

function compareYm(a: string, b: string): number {
  const A = parseYm(a);
  const B = parseYm(b);
  if (A.y !== B.y) return A.y - B.y;
  return A.m - B.m;
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function bumpMonthBy(ym: string, delta: number): string {
  const { y, m } = parseYm(ym);
  const d = new Date(y, m - 1 + delta, 1);
  return format(d, "yyyy-MM");
}

function minYm(a: string, b: string): string {
  return compareYm(a, b) <= 0 ? a : b;
}

function maxYm(a: string, b: string): string {
  return compareYm(a, b) >= 0 ? a : b;
}

function monthKeysInclusive(fromYm: string, toYm: string): string[] {
  const out: string[] = [];
  let cur = fromYm;
  let guard = 0;
  while (compareYm(cur, toYm) <= 0 && guard < 120) {
    out.push(cur);
    cur = bumpMonthBy(cur, 1);
    guard++;
  }
  return out;
}

/** Considera ativa se nenhum flag explícito a desliga (`active` / `is_active`). */
export function isRecurringItemActive(row: { active?: boolean | null; is_active?: boolean | null }): boolean {
  if (row.is_active === false) return false;
  if (row.active === false) return false;
  return true;
}

function recurringStartIso(row: RecurringForecastInput): string {
  const s = row.starts_at ?? row.start_date;
  if (typeof s === "string" && s.length >= 10) return s.slice(0, 10);
  return format(new Date(), "yyyy-MM-dd");
}

function recurringEndIso(row: RecurringForecastInput): string | null {
  const e = row.ends_at ?? row.end_date;
  if (typeof e === "string" && e.length >= 10) return e.slice(0, 10);
  return null;
}

function domForSchedule(row: RecurringForecastInput): number {
  const d = row.day_of_month ?? row.due_day;
  return typeof d === "number" && d >= 1 && d <= 31 ? d : 1;
}

function rowForSchedule(row: RecurringForecastInput): Parameters<typeof inferScheduleFromRow>[0] {
  return {
    day_of_month: domForSchedule(row),
    frequency: row.frequency ?? null,
    interval_months: row.interval_months ?? null,
    day_of_week: row.day_of_week ?? null,
  };
}

function occurrenceCountForPreset(preset: RecurringSchedulePreset, startIso: string, lastMonthYm: string): number {
  const start = parseISO(startIso.slice(0, 10));
  const { y, m } = parseYm(lastMonthYm);
  const end = endOfMonth(new Date(y, m - 1, 15));
  const days = Math.max(1, differenceInCalendarDays(end, start) + 1);
  if (preset === "daily") return Math.min(800, days + 14);
  if (preset === "weekly") return Math.min(200, Math.ceil(days / 7) + 12);
  return Math.min(160, Math.ceil(days / 26) + 36);
}

export function collectRecurringImpactsByMonth(
  recurring: RecurringForecastInput[],
  sortedMonths: string[],
): Map<string, { inc: number; exp: number }> {
  const impacts = new Map<string, { inc: number; exp: number }>();
  for (const ym of sortedMonths) impacts.set(ym, { inc: 0, exp: 0 });
  const monthSet = new Set(sortedMonths);
  if (!sortedMonths.length) return impacts;

  const lastYm = sortedMonths.at(-1) ?? currentMonthKey();

  for (const item of recurring) {
    if (!isRecurringItemActive(item)) continue;

    const startIso = recurringStartIso(item);
    const endIso = recurringEndIso(item);
    const endBoundary = endIso ? parseISO(endIso) : null;

    const inferred = inferScheduleFromRow(rowForSchedule(item));
    const count = occurrenceCountForPreset(inferred.preset, startIso, lastYm);
    const dates = buildOccurrenceDates(startIso, inferred.preset, {
      dayOfMonth: inferred.dayOfMonth,
      intervalMonths: inferred.intervalMonths,
      dayOfWeek: inferred.dayOfWeek,
    }, count);

    for (const d of dates) {
      const day = parseISO(d);
      if (endBoundary && day > endBoundary) break;
      const ym = d.slice(0, 7);
      if (!monthSet.has(ym)) continue;
      const slot = impacts.get(ym);
      if (!slot) continue;
      const amt = item.amount;
      if (item.type === "income") slot.inc += amt;
      else slot.exp += amt;
    }
  }

  return impacts;
}

export type MonthlyFixedFlowLine = { description: string; amount: number };

/**
 * Por mês, lista de recorrências com valor total naquele mês (várias ocorrências no mês somam numa linha).
 */
export function collectRecurringFixedFlowLinesByMonth(
  recurring: RecurringForecastInput[],
  sortedMonths: string[],
): Map<string, { incomeLines: MonthlyFixedFlowLine[]; expenseLines: MonthlyFixedFlowLine[] }> {
  const monthSet = new Set(sortedMonths);
  const lastYm = sortedMonths.at(-1) ?? currentMonthKey();

  type Bucket = { income: Map<string, MonthlyFixedFlowLine>; expense: Map<string, MonthlyFixedFlowLine> };
  const byMonth = new Map<string, Bucket>();
  for (const ym of sortedMonths) {
    byMonth.set(ym, { income: new Map(), expense: new Map() });
  }
  if (!sortedMonths.length) return new Map();

  const round2 = (n: number) => Math.round(n * 100) / 100;

  for (const item of recurring) {
    if (!isRecurringItemActive(item)) continue;

    const label = String(item.description ?? "").trim() || "Recorrência";
    const mergeKey = typeof item.id === "string" && item.id.length > 0 ? item.id : `noid:${label}`;

    const startIso = recurringStartIso(item);
    const endIso = recurringEndIso(item);
    const endBoundary = endIso ? parseISO(endIso) : null;

    const inferred = inferScheduleFromRow(rowForSchedule(item));
    const count = occurrenceCountForPreset(inferred.preset, startIso, lastYm);
    const dates = buildOccurrenceDates(startIso, inferred.preset, {
      dayOfMonth: inferred.dayOfMonth,
      intervalMonths: inferred.intervalMonths,
      dayOfWeek: inferred.dayOfWeek,
    }, count);

    for (const d of dates) {
      const day = parseISO(d);
      if (endBoundary && day > endBoundary) break;
      const ym = d.slice(0, 7);
      if (!monthSet.has(ym)) continue;
      const bucket = byMonth.get(ym);
      if (!bucket) continue;
      const side = item.type === "income" ? bucket.income : bucket.expense;
      const prev = side.get(mergeKey);
      const nextAmt = round2((prev?.amount ?? 0) + (Number(item.amount) || 0));
      side.set(mergeKey, { description: label, amount: nextAmt });
    }
  }

  const out = new Map<string, { incomeLines: MonthlyFixedFlowLine[]; expenseLines: MonthlyFixedFlowLine[] }>();
  for (const ym of sortedMonths) {
    const b = byMonth.get(ym);
    const incomeLines = b ? [...b.income.values()].sort((a, x) => a.description.localeCompare(x.description, "pt-BR")) : [];
    const expenseLines = b ? [...b.expense.values()].sort((a, x) => a.description.localeCompare(x.description, "pt-BR")) : [];
    out.set(ym, { incomeLines, expenseLines });
  }
  return out;
}

export type MergeMonthlyForecastsOptions = {
  /** Saldo agregado das contas no início da projeção (quando não há linha de previsão para o primeiro mês). */
  startingBalance: number;
};

/**
 * Soma recorrências ativas às receitas/despesas mensais e recalcula `projected_balance` mês a mês.
 * Valores da tabela `monthly_forecasts` são tratados como base; recorrências somam em cima (evite duplicar no servidor o mesmo fluxo).
 */
export function mergeMonthlyForecastsWithRecurring(
  forecasts: MonthlyForecast[],
  recurring: RecurringForecastInput[],
  options: MergeMonthlyForecastsOptions,
): MonthlyForecast[] {
  const cur = currentMonthKey();
  const sortedForecastMonths = [...new Set(forecasts.map((f) => f.month))].sort(compareYm);
  const firstF = sortedForecastMonths[0];
  const lastF = sortedForecastMonths[sortedForecastMonths.length - 1];

  let startYm = cur;
  if (firstF) startYm = minYm(startYm, firstF);

  let endYm = bumpMonthBy(cur, 23);
  if (lastF) endYm = maxYm(endYm, lastF);

  const sortedMonths = monthKeysInclusive(startYm, endYm);
  if (!sortedMonths.length) return [];

  const forecastByMonth = new Map(forecasts.map((f) => [f.month, f]));
  const recurImpacts = collectRecurringImpactsByMonth(recurring, sortedMonths);

  const userId = forecasts[0]?.user_id ?? "";
  const stamp = forecasts[0]?.created_at ?? new Date().toISOString();

  let opening = options.startingBalance;
  const firstMonth = sortedMonths.at(0);
  if (!firstMonth) return [];
  const firstBase = forecastByMonth.get(firstMonth);
  if (firstBase) {
    opening = firstBase.projected_balance - firstBase.projected_income + firstBase.projected_expense;
  }

  const out: MonthlyForecast[] = [];
  let balanceCursor = opening;

  for (const month of sortedMonths) {
    const base = forecastByMonth.get(month);
    const rec = recurImpacts.get(month) ?? { inc: 0, exp: 0 };
    const baseInc = base?.projected_income ?? 0;
    const baseExp = base?.projected_expense ?? 0;
    const totalInc = baseInc + rec.inc;
    const totalExp = baseExp + rec.exp;
    balanceCursor += totalInc - totalExp;

    out.push({
      id: base?.id ?? `local-forecast-${month}`,
      user_id: base?.user_id ?? userId,
      month,
      projected_income: totalInc,
      projected_expense: totalExp,
      projected_balance: balanceCursor,
      notes: base?.notes ?? null,
      created_at: base?.created_at ?? stamp,
      updated_at: base?.updated_at ?? stamp,
    });
  }

  return out;
}
