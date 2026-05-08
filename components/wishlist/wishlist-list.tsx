import type { ShoppingWishlistItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatMonthLabel } from "@/utils/format";

const priorityVariant: Record<string, "secondary" | "warning" | "destructive"> = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
};

export function WishlistList({ items }: { items: ShoppingWishlistItem[] }) {
  if (!items.length) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Your wishlist is empty. Add your first future purchase.</p>;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="gap-3">
            <CardTitle className="flex items-center justify-between gap-2">
              <span>{item.title}</span>
              <Badge variant={priorityVariant[item.priority]}>{item.priority}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Estimated price:</span> {formatCurrency(item.estimated_price)}
            </p>
            <p>
              <span className="text-muted-foreground">Desired date:</span> {item.desired_date ?? "Not defined"}
            </p>
            <p>
              <span className="text-muted-foreground">Recommended month:</span>{" "}
              {item.recommended_purchase_month ? formatMonthLabel(item.recommended_purchase_month) : "No safe month in current forecast"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
