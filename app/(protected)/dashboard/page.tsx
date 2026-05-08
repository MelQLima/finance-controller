import { Suspense } from "react";
import { format } from "date-fns";
import { EvolutionLineChart } from "@/components/charts/evolution-line-chart";
import { ExpensePieChart } from "@/components/charts/expense-pie-chart";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartPanelSkeleton,
  ListSkeleton,
  MetricCardsSkeleton,
  PanelSkeleton,
} from "@/components/ui/section-skeletons";
import { getDashboardData } from "@/services/dashboard";
import { getReferenceData } from "@/services/reference";
import { formatCurrency, formatMonthLabel } from "@/utils/format";

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const month = params.month ?? format(new Date(), "yyyy-MM");
  const dashboardPromise = getDashboardData(month);
  const referencePromise = getReferenceData();

  return (
    <div className="space-y-5">
      <Suspense fallback={<MetricCardsSkeleton />}>
        <SummarySection dashboardPromise={dashboardPromise} />
      </Suspense>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Suspense fallback={<PanelSkeleton className="order-2 xl:order-1" />} >
          <ExpenseSection month={month} dashboardPromise={dashboardPromise} referencePromise={referencePromise} />
        </Suspense>
        <Suspense fallback={<ChartPanelSkeleton className="order-1 xl:order-2" />}>
          <EvolutionSection dashboardPromise={dashboardPromise} />
        </Suspense>
      </div>

      <Suspense fallback={<ListPanelFallback title={`Latest entries for ${formatMonthLabel(month)}.`} />}>
        <RecentTransactionsSection month={month} dashboardPromise={dashboardPromise} />
      </Suspense>
    </div>
  );
}

async function SummarySection({ dashboardPromise }: { dashboardPromise: ReturnType<typeof getDashboardData> }) {
  const dashboard = await dashboardPromise;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <SummaryCard title="Current month balance" value={dashboard.currentBalance} kind="balance" />
      <SummaryCard title="Income" value={dashboard.income} kind="income" />
      <SummaryCard title="Expense" value={dashboard.expense} kind="expense" />
    </div>
  );
}

async function ExpenseSection({
  month,
  dashboardPromise,
  referencePromise,
}: {
  month: string;
  dashboardPromise: ReturnType<typeof getDashboardData>;
  referencePromise: ReturnType<typeof getReferenceData>;
}) {
  const [dashboard, { categories }] = await Promise.all([dashboardPromise, referencePromise]);
  const categoryMap = new Map(categories.map((item) => [item.id, item.name]));

  return (
    <Card className="order-2 xl:order-1">
      <CardHeader className="gap-2">
        <CardTitle>Expense Categories - {formatMonthLabel(month)}</CardTitle>
        <p className="text-sm text-muted-foreground">A quick read on where the month is being consumed.</p>
      </CardHeader>
      <CardContent>
        <ExpensePieChart
          data={dashboard.categorySeries.map((item) => ({
            name: categoryMap.get(item.categoryId) ?? "Unknown",
            value: item.amount,
          }))}
        />
      </CardContent>
    </Card>
  );
}

async function EvolutionSection({ dashboardPromise }: { dashboardPromise: ReturnType<typeof getDashboardData> }) {
  const dashboard = await dashboardPromise;

  return (
    <Card className="order-1 xl:order-2">
      <CardHeader className="gap-2">
        <CardTitle>Monthly Evolution</CardTitle>
        <p className="text-sm text-muted-foreground">Compare income, expense, and balance over time without leaving the phone.</p>
      </CardHeader>
      <CardContent>
        <EvolutionLineChart data={dashboard.evolutionSeries} />
      </CardContent>
    </Card>
  );
}

async function RecentTransactionsSection({
  month,
  dashboardPromise,
}: {
  month: string;
  dashboardPromise: ReturnType<typeof getDashboardData>;
}) {
  const dashboard = await dashboardPromise;

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Recent Transactions</CardTitle>
        <p className="text-sm text-muted-foreground">Latest entries for {formatMonthLabel(month)}.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {dashboard.recentTransactions.length ? (
          dashboard.recentTransactions.map((transaction) => (
            <div key={transaction.id} className="flex flex-col gap-3 rounded-[1.4rem] bg-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">{transaction.statement_date}</p>
              </div>
              <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                <Badge variant={transaction.type === "income" ? "success" : "warning"}>{transaction.type}</Badge>
                <p className="text-sm font-semibold sm:mt-1">{formatCurrency(transaction.amount)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No transactions for this month yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ListPanelFallback({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Recent Transactions</CardTitle>
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardHeader>
      <CardContent>
        <ListSkeleton />
      </CardContent>
    </Card>
  );
}
