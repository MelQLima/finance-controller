import type { MonthlyForecast } from "../types/database";
import {
  collectRecurringFixedFlowLinesByMonth,
  collectRecurringImpactsByMonth,
  type MonthlyFixedFlowLine,
  type RecurringForecastInput,
} from "./forecast-with-recurring";
import { getStatementDate } from "./statement-date";

export type MonthlyCashPlanRow = {
  month: string;
  /** Saldo na abertura do mês: soma das contas no 1.º mês do plano; nos seguintes, o saldo livre do mês anterior. */
  opening_balance: number;
  fixed_income: number;
  fixed_expense: number;
  fixed_income_lines: MonthlyFixedFlowLine[];
  fixed_expense_lines: MonthlyFixedFlowLine[];
  installments_expense: number;
  scheduled_statement_inflow: number;
  scheduled_statement_outflow: number;
  paid_statement_inflow: number;
  paid_statement_outflow: number;
  chart_inflow_total: number;
  chart_outflow_total: number;
  /** Abertura + entradas pendentes/agendadas − saídas pendentes/agendadas. */
  free_balance: number;
  invest_percent: number;
  invest_amount: number;
  closing_after_invest: number;
};

type StatementLike = Record<string, unknown>;

/** Totais de entrada por mês (fixos, agendados, pagos). */
export type ValoresEntradaPorMes = {
  fixed_income: number;
  fixed_income_lines: MonthlyFixedFlowLine[];
  scheduled_statement_inflow: number;
  paid_statement_inflow: number;
};

/** Totais de saída por mês (fixos, parcelas, agendados, pagos). */
export type ValoresSaidaPorMes = {
  fixed_expense: number;
  fixed_expense_lines: MonthlyFixedFlowLine[];
  installments_expense: number;
  scheduled_statement_outflow: number;
  paid_statement_outflow: number;
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function isPendingInstallmentExpense(row: StatementLike): boolean {
  const st = String(row.status ?? "").toLowerCase();
  if (st !== "pending" && st !== "scheduled") return false;
  if (String(row.type ?? "") !== "expense") return false;
  const ig = row.installment_group_id;
  if (typeof ig === "string" && ig.length > 0) return true;
  if (ig != null && typeof ig !== "string") return true;
  const total = row.installment_total;
  if (typeof total === "number" && total > 1) return true;
  return false;
}

function installmentExpenseByMonth(
  sortedMonths: string[],
  statements: StatementLike[],
): Map<string, number> {
  const monthSet = new Set(sortedMonths);
  const map = new Map<string, number>();
  for (const ym of sortedMonths) map.set(ym, 0);

  for (const row of statements) {
    if (!isPendingInstallmentExpense(row)) continue;
    const date = getStatementDate(row);
    if (date.length < 7) continue;
    const ym = date.slice(0, 7);
    if (!monthSet.has(ym)) continue;
    const amt = Number(row.amount) || 0;
    map.set(ym, (map.get(ym) ?? 0) + amt);
  }
  return map;
}

function pendingScheduledStatementFlowsByMonth(
  sortedMonths: string[],
  statements: StatementLike[],
): { income: Map<string, number>; expense: Map<string, number> } {
  const monthSet = new Set(sortedMonths);
  const income = new Map<string, number>();
  const expense = new Map<string, number>();
  for (const ym of sortedMonths) {
    income.set(ym, 0);
    expense.set(ym, 0);
  }
  for (const row of statements) {
    const st = String(row.status ?? "").toLowerCase();
    if (st !== "pending" && st !== "scheduled") continue;
    const date = getStatementDate(row);
    if (date.length < 7) continue;
    const ym = date.slice(0, 7);
    if (!monthSet.has(ym)) continue;
    const amt = Number(row.amount) || 0;
    if (String(row.type) === "income") income.set(ym, (income.get(ym) ?? 0) + amt);
    else expense.set(ym, (expense.get(ym) ?? 0) + amt);
  }
  return { income, expense };
}

function paidStatementFlowsByMonth(
  sortedMonths: string[],
  statements: StatementLike[],
): { income: Map<string, number>; expense: Map<string, number> } {
  const monthSet = new Set(sortedMonths);
  const income = new Map<string, number>();
  const expense = new Map<string, number>();
  for (const ym of sortedMonths) {
    income.set(ym, 0);
    expense.set(ym, 0);
  }
  for (const row of statements) {
    if (String(row.status ?? "").toLowerCase() !== "paid") continue;
    const date = getStatementDate(row);
    if (date.length < 7) continue;
    const ym = date.slice(0, 7);
    if (!monthSet.has(ym)) continue;
    const amt = Number(row.amount) || 0;
    if (String(row.type) === "income") income.set(ym, (income.get(ym) ?? 0) + amt);
    else expense.set(ym, (expense.get(ym) ?? 0) + amt);
  }
  return { income, expense };
}

/**
 * Agrega todas as fontes de entrada por mês (recorrências e extratos por data).
 */
export function calcularValoresEntrada(
  sortedMonths: string[],
  recurring: RecurringForecastInput[],
  statements: StatementLike[],
): Map<string, ValoresEntradaPorMes> {
  const fixedByMonth = collectRecurringImpactsByMonth(recurring, sortedMonths);
  const fixedLinesByMonth = collectRecurringFixedFlowLinesByMonth(recurring, sortedMonths);
  const sched = pendingScheduledStatementFlowsByMonth(sortedMonths, statements);
  const paid = paidStatementFlowsByMonth(sortedMonths, statements);

  const out = new Map<string, ValoresEntradaPorMes>();
  for (const month of sortedMonths) {
    const fx = fixedByMonth.get(month) ?? { inc: 0, exp: 0 };
    const lines = fixedLinesByMonth.get(month) ?? { incomeLines: [], expenseLines: [] };
    out.set(month, {
      fixed_income: roundMoney(fx.inc),
      fixed_income_lines: lines.incomeLines,
      scheduled_statement_inflow: roundMoney(sched.income.get(month) ?? 0),
      paid_statement_inflow: roundMoney(paid.income.get(month) ?? 0),
    });
  }
  return out;
}

/**
 * Agrega todas as fontes de saída por mês (recorrências, parcelas e extratos por data).
 */
export function calcularValoresSaida(
  sortedMonths: string[],
  recurring: RecurringForecastInput[],
  statements: StatementLike[],
): Map<string, ValoresSaidaPorMes> {
  const fixedByMonth = collectRecurringImpactsByMonth(recurring, sortedMonths);
  const fixedLinesByMonth = collectRecurringFixedFlowLinesByMonth(recurring, sortedMonths);
  const instByMonth = installmentExpenseByMonth(sortedMonths, statements);
  const sched = pendingScheduledStatementFlowsByMonth(sortedMonths, statements);
  const paid = paidStatementFlowsByMonth(sortedMonths, statements);

  const out = new Map<string, ValoresSaidaPorMes>();
  for (const month of sortedMonths) {
    const fx = fixedByMonth.get(month) ?? { inc: 0, exp: 0 };
    const lines = fixedLinesByMonth.get(month) ?? { incomeLines: [], expenseLines: [] };
    out.set(month, {
      fixed_expense: roundMoney(fx.exp),
      fixed_expense_lines: lines.expenseLines,
      installments_expense: roundMoney(instByMonth.get(month) ?? 0),
      scheduled_statement_outflow: roundMoney(sched.expense.get(month) ?? 0),
      paid_statement_outflow: roundMoney(paid.expense.get(month) ?? 0),
    });
  }
  return out;
}

/**
 * Monta as linhas do plano: gráfico (fixos + extratos), saldo livre só com pendências/agendadas,
 * investimento e transporte mês a mês.
 */
export function construirResultado(
  sortedMonths: string[],
  startingBalance: number,
  investPercentOfFree: number,
  entradaPorMes: Map<string, ValoresEntradaPorMes>,
  saidaPorMes: Map<string, ValoresSaidaPorMes>,
): MonthlyCashPlanRow[] {
  if (!sortedMonths.length) return [];

  const pct = Math.min(100, Math.max(0, Number.isFinite(investPercentOfFree) ? investPercentOfFree : 0));
  const rows: MonthlyCashPlanRow[] = [];
  let opening = roundMoney(startingBalance);

  for (const month of sortedMonths) {
    const e = entradaPorMes.get(month);
    const s = saidaPorMes.get(month);
    if (e === undefined || s === undefined) {
      throw new Error(`Plano de caixa: mês em falta (${month}).`);
    }

    const chart_inflow_total = roundMoney(e.fixed_income + e.scheduled_statement_inflow + e.paid_statement_inflow);
    const chart_outflow_total = roundMoney(s.fixed_expense + s.scheduled_statement_outflow + s.paid_statement_outflow);
    const free_balance = roundMoney(opening + e.scheduled_statement_inflow - s.scheduled_statement_outflow);
    const invest_amount = free_balance > 0 ? roundMoney((free_balance * pct) / 100) : 0;
    const closing_after_invest = roundMoney(free_balance - invest_amount);

    rows.push({
      month,
      opening_balance: opening,
      fixed_income: e.fixed_income,
      fixed_expense: s.fixed_expense,
      fixed_income_lines: e.fixed_income_lines,
      fixed_expense_lines: s.fixed_expense_lines,
      installments_expense: s.installments_expense,
      scheduled_statement_inflow: e.scheduled_statement_inflow,
      scheduled_statement_outflow: s.scheduled_statement_outflow,
      paid_statement_inflow: e.paid_statement_inflow,
      paid_statement_outflow: s.paid_statement_outflow,
      chart_inflow_total,
      chart_outflow_total,
      free_balance,
      invest_percent: pct,
      invest_amount,
      closing_after_invest,
    });

    opening = free_balance;
  }

  return rows;
}

/**
 * Planejamento mensal: delega em `calcularValoresEntrada`, `calcularValoresSaida` e `construirResultado`.
 */
export function buildMonthlyCashPlan({
  sortedMonths,
  startingBalance,
  recurring,
  statements,
  investPercentOfFree,
}: {
  sortedMonths: string[];
  startingBalance: number;
  recurring: RecurringForecastInput[];
  statements: StatementLike[];
  investPercentOfFree: number;
}): MonthlyCashPlanRow[] {
  if (!sortedMonths.length) return [];
  const entrada = calcularValoresEntrada(sortedMonths, recurring, statements);
  const saida = calcularValoresSaida(sortedMonths, recurring, statements);
  return construirResultado(sortedMonths, startingBalance, investPercentOfFree, entrada, saida);
}

export function monthlyCashPlanToForecasts(plan: MonthlyCashPlanRow[], userId: string): MonthlyForecast[] {
  const stamp = new Date().toISOString();
  return plan.map((r) => ({
    id: `plan-${r.month}`,
    user_id: userId,
    month: r.month,
    projected_income: r.fixed_income + r.scheduled_statement_inflow + r.paid_statement_inflow,
    projected_expense: r.fixed_expense + r.scheduled_statement_outflow + r.paid_statement_outflow,
    projected_balance: r.free_balance,
    plan_installments: r.installments_expense,
    plan_free_before_invest: r.free_balance,
    plan_invest_amount: r.invest_amount,
    plan_closing_after_invest: r.closing_after_invest,
    notes: null,
    created_at: stamp,
    updated_at: stamp,
  }));
}
