import type { MonthlyCashPlanRow, MonthlyForecast, Statement } from "@finance-controller/shared";
import { normalizeStatementDates } from "@finance-controller/shared";
import { loadForecastPlanContext } from "@/features/forecast/merged-monthly-forecasts";

export type ForecastData = {
  monthlyForecasts: MonthlyForecast[];
  plan: MonthlyCashPlanRow[];
  investPercent: number;
  scheduledStatements: Statement[];
};

export async function getForecastData(): Promise<ForecastData> {
  const { forecasts, plan, investPercent, pendingStatements } = await loadForecastPlanContext();

  return {
    monthlyForecasts: forecasts,
    plan,
    investPercent,
    scheduledStatements: normalizeStatementDates(pendingStatements).slice(0, 20) as unknown as Statement[],
  };
}
