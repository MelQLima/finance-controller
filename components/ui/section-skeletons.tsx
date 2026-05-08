import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MetricCardsSkeleton({ total = 3 }: { total?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: total }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PanelSkeleton({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-xl" />
        ))}
      </CardContent>
    </Card>
  );
}

export function ChartPanelSkeleton({ className = "" }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-60 max-w-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </CardContent>
    </Card>
  );
}

export function FormPanelSkeleton({
  fields = 6,
  className = "",
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-11 w-full rounded-2xl" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-2xl" />
      </CardContent>
    </Card>
  );
}

export function ListSkeleton({ total = 4 }: { total?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: total }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-[1.1rem]" />
      ))}
    </div>
  );
}
