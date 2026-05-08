import { Suspense } from "react";
import { EvolutionLineChart } from "@/components/charts/evolution-line-chart";
import { RecurringForm } from "@/components/forms/recurring-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartPanelSkeleton,
  FormPanelSkeleton,
  ListSkeleton,
} from "@/components/ui/section-skeletons";
import { getForecastData } from "@/services/forecast";
import { getRecurringItems } from "@/services/recurring";
import { getReferenceData } from "@/services/reference";
import { formatCurrency } from "@/utils/format";

export default function ForecastPage() {
  const referencePromise = getReferenceData();
  const forecastPromise = getForecastData();
  const recurringItemsPromise = getRecurringItems();

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Suspense fallback={<FormPanelSkeleton fields={7} />}>
          <RecurringFormSection referencePromise={referencePromise} />
        </Suspense>
        <Suspense fallback={<ChartPanelSkeleton />}>
          <ForecastChartSection forecastPromise={forecastPromise} />
        </Suspense>
      </div>

      <Suspense fallback={<RecurringItemsFallback />}>
        <RecurringItemsSection recurringItemsPromise={recurringItemsPromise} />
      </Suspense>

      <Suspense fallback={<ScheduledPaymentsFallback />}>
        <ScheduledPaymentsSection forecastPromise={forecastPromise} />
      </Suspense>
    </div>
  );
}

async function RecurringFormSection({
  referencePromise,
}: {
  referencePromise: ReturnType<typeof getReferenceData>;
}) {
  const { accounts, categories } = await referencePromise;

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Recurring Bills / Income</CardTitle>
        <p className="text-sm text-muted-foreground">Register repeating cash flow with fewer steps on small screens.</p>
      </CardHeader>
      <CardContent>
        <RecurringForm accounts={accounts} categories={categories} />
      </CardContent>
    </Card>
  );
}

async function ForecastChartSection({
  forecastPromise,
}: {
  forecastPromise: ReturnType<typeof getForecastData>;
}) {
  const forecast = await forecastPromise;

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Monthly Forecast Trend</CardTitle>
        <p className="text-sm text-muted-foreground">Projected balance and recurring impact over the coming months.</p>
      </CardHeader>
      <CardContent>
        <EvolutionLineChart
          data={forecast.monthlyForecasts.map((item) => ({
            month: item.month,
            income: item.projected_income,
            expense: item.projected_expense,
            balance: item.projected_balance,
          }))}
        />
      </CardContent>
    </Card>
  );
}

async function RecurringItemsSection({
  recurringItemsPromise,
}: {
  recurringItemsPromise: ReturnType<typeof getRecurringItems>;
}) {
  const recurringItems = await recurringItemsPromise;

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Active Recurring Items</CardTitle>
        <p className="text-sm text-muted-foreground">Everything that will return automatically to your ledger.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {recurringItems.length ? (
          recurringItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-[1.4rem] bg-muted/45 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">Day {item.day_of_month} each month</p>
              </div>
              <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                <Badge variant={item.type === "income" ? "success" : "warning"}>{item.type}</Badge>
                <p className="font-semibold sm:mt-1">{formatCurrency(item.amount)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No recurring items yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

async function ScheduledPaymentsSection({
  forecastPromise,
}: {
  forecastPromise: ReturnType<typeof getForecastData>;
}) {
  const forecast = await forecastPromise;

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Scheduled Payments</CardTitle>
        <p className="text-sm text-muted-foreground">Upcoming items generated from your current recurrence setup.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {forecast.scheduledStatements.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 rounded-[1.4rem] border border-border p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium">{item.description}</p>
              <p className="text-xs text-muted-foreground">{item.statement_date}</p>
            </div>
            <p className="font-semibold">{formatCurrency(item.amount)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecurringItemsFallback() {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Active Recurring Items</CardTitle>
        <p className="text-sm text-muted-foreground">Everything that will return automatically to your ledger.</p>
      </CardHeader>
      <CardContent>
        <ListSkeleton />
      </CardContent>
    </Card>
  );
}

function ScheduledPaymentsFallback() {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Scheduled Payments</CardTitle>
        <p className="text-sm text-muted-foreground">Upcoming items generated from your current recurrence setup.</p>
      </CardHeader>
      <CardContent>
        <ListSkeleton />
      </CardContent>
    </Card>
  );
}
