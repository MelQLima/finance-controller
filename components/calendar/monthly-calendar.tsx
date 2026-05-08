"use client";

import { useEffect, useMemo, useRef } from "react";
import { eachDayOfInterval, endOfMonth, format, isToday, startOfMonth } from "date-fns";
import type { Statement } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";

export function MonthlyCalendar({ month, statements }: { month: string; statements: Statement[] }) {
  const baseDate = new Date(`${month}-01T00:00:00`);
  const days = eachDayOfInterval({ start: startOfMonth(baseDate), end: endOfMonth(baseDate) });
  const todayCardRef = useRef<HTMLDivElement | null>(null);
  const currentMonth = format(new Date(), "yyyy-MM");
  const statementsByDate = useMemo(() => {
    return statements.reduce<Record<string, Statement[]>>((acc, statement) => {
      const bucket = acc[statement.statement_date] ?? [];
      bucket.push(statement);
      acc[statement.statement_date] = bucket;
      return acc;
    }, {});
  }, [statements]);

  useEffect(() => {
    if (month !== currentMonth || !todayCardRef.current) {
      return;
    }

    todayCardRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [month, currentMonth]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const items = statementsByDate[key] ?? [];
        const isCurrentDay = isToday(day);
        return (
          <div
            key={key}
            ref={isCurrentDay ? todayCardRef : null}
            className={cn(
              "glass-panel min-h-32 rounded-[1.1rem] border border-border p-2.5 transition-colors",
              isCurrentDay && "border-primary bg-secondary/45 shadow-[0_0_0_1px_var(--primary)]",
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className={cn("text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground", isCurrentDay && "text-primary")}>
                  {format(day, "dd MMM")}
                </p>
                {isCurrentDay ? <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">Today</span> : null}
              </div>
              <span className={cn("rounded-full bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground", isCurrentDay && "bg-primary/10 text-primary")}>
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-lg bg-muted/70 p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Badge variant={item.type === "income" ? "success" : "warning"}>{item.type}</Badge>
                    <span className="text-xs text-muted-foreground">{item.status}</span>
                  </div>
                  <p className="truncate text-xs">{item.description}</p>
                  <p className="text-xs font-medium">{formatCurrency(item.amount)}</p>
                </div>
              ))}
              {!items.length ? <p className="text-xs text-muted-foreground">No transactions scheduled.</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
