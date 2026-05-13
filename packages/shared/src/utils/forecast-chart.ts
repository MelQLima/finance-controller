import type { MonthlyForecast } from "../types/database";
import type { MonthlyCashPlanRow } from "./monthly-cash-plan";
import type { MonthlyFixedFlowLine } from "./forecast-with-recurring";
import { formatMonthLabel } from "./format";

export type ForecastChartGranularity = "monthly" | "quarterly" | "yearly";

export type ForecastChartPoint = {
  bucketKey: string;
  label: string;
  projected_balance: number;
  projected_income: number;
  projected_expense: number;
};

type ForecastRow = Pick<MonthlyForecast, "month" | "projected_balance" | "projected_income" | "projected_expense">;

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

function quarterIndex(month1to12: number): 1 | 2 | 3 | 4 {
  return Math.ceil(month1to12 / 3) as 1 | 2 | 3 | 4;
}

function bucketKeyFor(granularity: ForecastChartGranularity, month: string): string {
  const { y, m } = parseYm(month);
  if (granularity === "monthly") return month;
  if (granularity === "quarterly") return `${y}-Q${quarterIndex(m)}`;
  return String(y);
}

function labelForBucket(granularity: ForecastChartGranularity, bucketKey: string): string {
  if (granularity === "monthly") return formatMonthLabel(bucketKey);
  if (granularity === "yearly") return bucketKey;
  const [y, qPart] = bucketKey.split("-Q");
  const q = Number(qPart) || 1;
  const yy = y?.slice(2) ?? "";
  return `T${q}/${yy}`;
}

function sortBucketKeys(granularity: ForecastChartGranularity, keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    if (granularity === "monthly") return compareYm(a, b);
    if (granularity === "yearly") return Number(a) - Number(b);
    const [ya, qa] = a.split("-Q");
    const [yb, qb] = b.split("-Q");
    const yn = Number(ya) - Number(yb);
    if (yn !== 0) return yn;
    return Number(qa) - Number(qb);
  });
}

const LIMITS: Record<ForecastChartGranularity, { rawMonthsCap: number; maxBuckets: number }> = {
  monthly: { rawMonthsCap: 24, maxBuckets: 12 },
  quarterly: { rawMonthsCap: 36, maxBuckets: 8 },
  yearly: { rawMonthsCap: 60, maxBuckets: 6 },
};

/**
 * Monta série para gráfico a partir de `monthly_forecasts`.
 * - Mensal: um ponto por mês (saldo = fim do mês).
 * - Trimestral: um ponto por trimestre (saldo = último mês do trimestre na janela; receitas/despesas somadas no trimestre).
 * - Anual: um ponto por ano (mesma lógica).
 */
export function buildForecastChartSeries(
  rows: ForecastRow[],
  granularity: ForecastChartGranularity,
): ForecastChartPoint[] {
  const sorted = [...rows].sort((a, b) => compareYm(a.month, b.month));
  if (!sorted.length) return [];

  const thisMonth = currentMonthKey();
  const startIdx = sorted.findIndex((r) => r.month >= thisMonth);
  const { rawMonthsCap, maxBuckets } = LIMITS[granularity];
  const sliceStart = startIdx === -1 ? Math.max(0, sorted.length - rawMonthsCap) : startIdx;
  const windowed = sorted.slice(sliceStart, sliceStart + rawMonthsCap);

  const buckets = new Map<string, ForecastRow[]>();
  for (const row of windowed) {
    const bk = bucketKeyFor(granularity, row.month);
    const list = buckets.get(bk);
    if (list) list.push(row);
    else buckets.set(bk, [row]);
  }

  const keys = sortBucketKeys(granularity, [...buckets.keys()]).slice(0, maxBuckets);

  return keys.flatMap((bucketKey) => {
    const months = buckets.get(bucketKey) ?? [];
    const last = months.at(-1);
    if (!last) return [];
    const projected_income = months.reduce((s, r) => s + r.projected_income, 0);
    const projected_expense = months.reduce((s, r) => s + r.projected_expense, 0);
    return [
      {
        bucketKey,
        label: labelForBucket(granularity, bucketKey),
        projected_balance: last.projected_balance,
        projected_income,
        projected_expense,
      },
    ];
  });
}

export type ForecastStackedPoint = {
  bucketKey: string;
  label: string;
  /** Saldo livre no último mês do bucket (plano encadeado). */
  free_balance: number;
  /** Soma das entradas do gráfico no período (composição da barra). */
  inflow: number;
  /** Soma das saídas do gráfico no período (composição da barra). */
  outflow: number;
};

/**
 * Série para gráfico empilhado (entradas vs saídas) a partir do plano mensal.
 * Agrega `chart_inflow_total` / `chart_outflow_total` por bucket para as faixas; `free_balance` = saldo livre real no último mês do bucket.
 */
export function buildForecastStackedCashflowSeries(
  plan: MonthlyCashPlanRow[],
  granularity: ForecastChartGranularity,
): ForecastStackedPoint[] {
  const sorted = [...plan].sort((a, b) => compareYm(a.month, b.month));
  if (!sorted.length) return [];

  const thisMonth = currentMonthKey();
  const startIdx = sorted.findIndex((r) => r.month >= thisMonth);
  const { rawMonthsCap, maxBuckets } = LIMITS[granularity];
  const sliceStart = startIdx === -1 ? Math.max(0, sorted.length - rawMonthsCap) : startIdx;
  const windowed = sorted.slice(sliceStart, sliceStart + rawMonthsCap);

  const buckets = new Map<string, MonthlyCashPlanRow[]>();
  for (const row of windowed) {
    const bk = bucketKeyFor(granularity, row.month);
    const list = buckets.get(bk);
    if (list) list.push(row);
    else buckets.set(bk, [row]);
  }

  const keys = sortBucketKeys(granularity, [...buckets.keys()]).slice(0, maxBuckets);

  return keys.flatMap((bucketKey) => {
    const months = buckets.get(bucketKey) ?? [];
    const last = months.at(-1);
    if (!last) return [];
    const inflow = roundMoney(months.reduce((s, r) => s + r.chart_inflow_total, 0));
    const outflow = roundMoney(months.reduce((s, r) => s + r.chart_outflow_total, 0));
    return [
      {
        bucketKey,
        label: labelForBucket(granularity, bucketKey),
        free_balance: last.free_balance,
        inflow,
        outflow,
      },
    ];
  });
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function mergeFixedLinesByDescription(rows: MonthlyCashPlanRow[], kind: "income" | "expense"): MonthlyFixedFlowLine[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const list = kind === "income" ? r.fixed_income_lines : r.fixed_expense_lines;
    for (const l of list) {
      map.set(l.description, (map.get(l.description) ?? 0) + l.amount);
    }
  }
  return [...map.entries()]
    .map(([description, amount]) => ({ description, amount: roundMoney(amount) }))
    .sort((a, b) => a.description.localeCompare(b.description, "pt-BR"));
}

export type ForecastBucketDetail = {
  bucketKey: string;
  label: string;
  months: string[];
  incomeLines: MonthlyFixedFlowLine[];
  expenseLines: MonthlyFixedFlowLine[];
  installments_expense: number;
  scheduled_inflow: number;
  scheduled_outflow: number;
  paid_inflow: number;
  paid_outflow: number;
  opening_balance: number;
  free_balance_end: number;
  invest_amount_end: number;
  closing_after_invest_end: number;
};

/** Agrega linhas do plano para um bucket (mês / trimestre / ano). */
export function buildForecastBucketDetail(
  plan: MonthlyCashPlanRow[],
  granularity: ForecastChartGranularity,
  bucketKey: string,
  label: string,
): ForecastBucketDetail | null {
  const rows = plan
    .filter((r) => bucketKeyFor(granularity, r.month) === bucketKey)
    .sort((a, b) => compareYm(a.month, b.month));
  if (!rows.length) return null;

  const last = rows[rows.length - 1];
  if (!last) return null;

  return {
    bucketKey,
    label,
    months: rows.map((r) => r.month),
    incomeLines: mergeFixedLinesByDescription(rows, "income"),
    expenseLines: mergeFixedLinesByDescription(rows, "expense"),
    installments_expense: roundMoney(rows.reduce((s, r) => s + r.installments_expense, 0)),
    scheduled_inflow: roundMoney(rows.reduce((s, r) => s + r.scheduled_statement_inflow, 0)),
    scheduled_outflow: roundMoney(rows.reduce((s, r) => s + r.scheduled_statement_outflow, 0)),
    paid_inflow: roundMoney(rows.reduce((s, r) => s + r.paid_statement_inflow, 0)),
    paid_outflow: roundMoney(rows.reduce((s, r) => s + r.paid_statement_outflow, 0)),
    opening_balance: rows[0]?.opening_balance ?? 0,
    free_balance_end: last.free_balance,
    invest_amount_end: last.invest_amount,
    closing_after_invest_end: last.closing_after_invest,
  };
}
