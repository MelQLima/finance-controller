import { Suspense } from "react";
import { format } from "date-fns";
import { MonthlyCalendar } from "@/components/calendar/monthly-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PanelSkeleton } from "@/components/ui/section-skeletons";
import { getCalendarItems } from "@/services/calendar";

interface CalendarPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const month = params.month ?? format(new Date(), "yyyy-MM");
  const statementsPromise = getCalendarItems(month);

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <CardTitle>Calendar</CardTitle>
          <p className="text-sm text-muted-foreground">Daily view optimized for vertical scrolling first, dense grid second.</p>
        </div>
        <form>
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="h-11 rounded-2xl border border-border bg-card/70 px-4 text-sm"
          />
        </form>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PanelSkeleton lines={8} />}>
          <CalendarGridSection month={month} statementsPromise={statementsPromise} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

async function CalendarGridSection({
  month,
  statementsPromise,
}: {
  month: string;
  statementsPromise: ReturnType<typeof getCalendarItems>;
}) {
  const statements = await statementsPromise;
  return <MonthlyCalendar month={month} statements={statements} />;
}
