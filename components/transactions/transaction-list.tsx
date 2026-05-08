"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import type { Statement } from "@/types";
import { deleteTransactionAction } from "@/app/actions/transactions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";

interface TransactionListProps {
  statements: Statement[];
}

export function TransactionList({ statements }: TransactionListProps) {
  const [pending, startTransition] = useTransition();

  if (!statements.length) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No transactions found for current filters.</p>;
  }

  return (
    <>
      <div className="space-y-2.5 md:hidden">
        {statements.map((item) => (
          <div key={item.id} className="glass-panel rounded-[1.1rem] border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{item.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.statement_date}</p>
                {item.installment_total ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Installment {item.installment_number}/{item.installment_total}
                  </p>
                ) : null}
              </div>
              <p className="text-sm font-semibold">{formatCurrency(item.amount)}</p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={item.type === "income" ? "success" : "warning"}>{item.type}</Badge>
              <Badge variant="secondary">{item.status}</Badge>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href={`/transactions?edit=${item.id}`}
                className="press-feedback inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-border bg-card/70 text-sm font-semibold hover:bg-muted/70"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
              <Button
                className="flex-1"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await deleteTransactionAction(item.id);
                    if (result.success) {
                      toast.success(result.message);
                    } else {
                      toast.error(result.message);
                    }
                  })
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[1.75rem] border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Description</th>
              <th className="p-3">Date</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {statements.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="p-3">
                  <p>{item.description}</p>
                  {item.installment_total ? (
                    <p className="text-xs text-muted-foreground">
                      Installment {item.installment_number}/{item.installment_total}
                    </p>
                  ) : null}
                </td>
                <td className="p-3">{item.statement_date}</td>
                <td className="p-3">
                  <Badge variant={item.type === "income" ? "success" : "warning"}>{item.type}</Badge>
                </td>
                <td className="p-3">{item.status}</td>
                <td className="p-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/transactions?edit=${item.id}`}
                      className="press-feedback inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card/70 hover:bg-muted/70"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <Button
                      size="icon"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await deleteTransactionAction(item.id);
                          if (result.success) {
                            toast.success(result.message);
                          } else {
                            toast.error(result.message);
                          }
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
