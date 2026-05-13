import { addDays, addMonths, addWeeks, format, getDay, parseISO, setDate, startOfDay, startOfMonth } from "date-fns";

/** Presets exibidos no app; `custom` = dia do mês + intervalo em meses. */
export type RecurringSchedulePreset = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

export const WEEKDAY_LABELS_PT = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;

function clampDayInMonth(date: Date, day: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return setDate(date, Math.min(Math.max(1, day), last));
}

/** Intervalo em meses entre ocorrências para presets mensais (custom traz valor explícito). */
export function effectiveIntervalMonths(
  preset: RecurringSchedulePreset,
  customIntervalMonths?: number,
): number {
  switch (preset) {
    case "monthly":
      return 1;
    case "quarterly":
      return 3;
    case "yearly":
      return 12;
    case "custom":
      return Math.min(60, Math.max(1, customIntervalMonths ?? 1));
    default:
      return 1;
  }
}

/** Primeira data mensal (dia do mês) em ou após `start`. */
function firstMonthlyOnOrAfter(start: Date, dayOfMonth: number): Date {
  let m = startOfMonth(start);
  for (let i = 0; i < 48; i++) {
    const cand = clampDayInMonth(m, dayOfMonth);
    if (cand >= start) return cand;
    m = addMonths(m, 1);
  }
  return clampDayInMonth(start, dayOfMonth);
}

/**
 * Próximas `count` datas de vencimento (YYYY-MM-DD) conforme o agendamento.
 */
export function buildOccurrenceDates(
  startIso: string,
  preset: RecurringSchedulePreset,
  opts: { dayOfMonth: number; intervalMonths?: number; dayOfWeek?: number },
  count: number,
): string[] {
  const daySlice = startIso.slice(0, 10);
  const start = startOfDay(parseISO(daySlice));
  const out: string[] = [];

  if (preset === "daily") {
    for (let i = 0; i < count; i++) out.push(format(addDays(start, i), "yyyy-MM-dd"));
    return out;
  }

  if (preset === "weekly") {
    const target = opts.dayOfWeek ?? 1;
    let d = start;
    let guard = 0;
    while (getDay(d) !== target && guard < 14) {
      d = addDays(d, 1);
      guard++;
    }
    for (let i = 0; i < count; i++) out.push(format(addWeeks(d, i), "yyyy-MM-dd"));
    return out;
  }

  const interval = effectiveIntervalMonths(preset, opts.intervalMonths);
  const dom = opts.dayOfMonth;
  const first = firstMonthlyOnOrAfter(start, dom);
  for (let i = 0; i < count; i++) {
    const base = addMonths(first, i * interval);
    out.push(format(clampDayInMonth(base, dom), "yyyy-MM-dd"));
  }
  return out;
}

/** Lê linha do banco e devolve preset + opções para o formulário. */
export function inferScheduleFromRow(row: {
  day_of_month?: number | null;
  due_day?: number | null;
  frequency?: string | null;
  interval_months?: number | null;
  day_of_week?: number | null;
}): {
  preset: RecurringSchedulePreset;
  intervalMonths: number;
  dayOfWeek: number;
  dayOfMonth: number;
} {
  const dom = row.day_of_month ?? row.due_day ?? 1;
  const raw = (row.frequency ?? "monthly").toLowerCase();
  const valid: RecurringSchedulePreset[] = ["daily", "weekly", "monthly", "quarterly", "yearly", "custom"];
  const preset = (valid.includes(raw as RecurringSchedulePreset) ? raw : "monthly") as RecurringSchedulePreset;
  const stored = row.interval_months;
  const intervalMonths =
    preset === "custom"
      ? stored != null && stored >= 1
        ? stored
        : 2
      : preset === "monthly"
        ? 1
        : effectiveIntervalMonths(preset);
  const dow = row.day_of_week ?? 1;
  return { preset, intervalMonths, dayOfWeek: dow, dayOfMonth: dom };
}

/** Texto curto para listas (PT-BR). */
export function describeRecurringSchedulePt(
  preset: RecurringSchedulePreset,
  opts: { dayOfMonth: number; intervalMonths?: number; dayOfWeek?: number },
): string {
  switch (preset) {
    case "daily":
      return "Todo dia";
    case "weekly": {
      const d = opts.dayOfWeek ?? 1;
      const label = WEEKDAY_LABELS_PT[d] ?? `Dia ${d}`;
      return `Semanal · ${label}`;
    }
    case "monthly":
      return `Todo dia ${opts.dayOfMonth} do mês`;
    case "quarterly":
      return `A cada 3 meses, dia ${opts.dayOfMonth}`;
    case "yearly":
      return `Uma vez por ano, dia ${opts.dayOfMonth}`;
    case "custom": {
      const n = opts.intervalMonths ?? 1;
      return `A cada ${n} meses, dia ${opts.dayOfMonth}`;
    }
    default:
      return `Dia ${opts.dayOfMonth}`;
  }
}
