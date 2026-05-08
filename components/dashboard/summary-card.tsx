import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";

const iconMap = {
  balance: Wallet,
  income: ArrowUpCircle,
  expense: ArrowDownCircle,
};

export function SummaryCard({
  title,
  value,
  kind,
}: {
  title: string;
  value: number;
  kind: keyof typeof iconMap;
}) {
  const Icon = iconMap[kind];
  return (
    <Card className="relative">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
          <p className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{formatCurrency(value)}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/70">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardTitle className="text-xs font-medium text-muted-foreground">Updated for the selected period</CardTitle>
      </CardContent>
    </Card>
  );
}
