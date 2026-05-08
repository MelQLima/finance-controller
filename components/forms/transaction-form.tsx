"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { useFormStatus } from "react-dom";
import { z } from "zod";
import { upsertTransactionAction } from "@/app/actions/transactions";
import { defaultActionState } from "@/lib/actions/result";
import type { Account, Category, Statement } from "@/types";
import { transactionSchema } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  transaction?: Statement;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Saving..." : "Save transaction"}
    </Button>
  );
}

export function TransactionForm({ accounts, categories, transaction }: TransactionFormProps) {
  const [state, formAction] = useActionState(upsertTransactionAction, defaultActionState);
  const form = useForm<z.input<typeof transactionSchema>, unknown, z.output<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      id: transaction?.id,
      description: transaction?.description ?? "",
      amount: transaction?.amount ?? 0,
      type: transaction?.type ?? "expense",
      status: transaction?.status ?? "paid",
      account_id: transaction?.account_id ?? "",
      category_id: transaction?.category_id ?? "",
      statement_date: transaction?.statement_date ?? new Date().toISOString().slice(0, 10),
      due_date: transaction?.due_date ?? "",
      installments: transaction?.installment_total ?? 1,
    },
  });

  return (
    <form action={formAction} className="grid gap-4 rounded-[1.5rem] border border-border bg-muted/25 p-4 md:grid-cols-2">
      <input type="hidden" name="id" value={form.watch("id") ?? ""} />

      <div className="space-y-2 md:col-span-2">
        <Label>Description</Label>
        <Input {...form.register("description")} name="description" />
      </div>

      <div className="space-y-2">
        <Label>Amount</Label>
        <Input type="number" step="0.01" {...form.register("amount")} name="amount" />
      </div>

      <div className="space-y-2">
        <Label>Installments</Label>
        <Input type="number" min={1} max={60} {...form.register("installments")} name="installments" />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          {...form.register("type")}
          name="type"
          options={[
            { label: "Expense", value: "expense" },
            { label: "Income", value: "income" },
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          {...form.register("status")}
          name="status"
          options={[
            { label: "Paid", value: "paid" },
            { label: "Pending", value: "pending" },
            { label: "Scheduled", value: "scheduled" },
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Account</Label>
        <Select
          {...form.register("account_id")}
          name="account_id"
          options={accounts.map((account) => ({ label: account.name, value: account.id }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          {...form.register("category_id")}
          name="category_id"
          options={categories.map((category) => ({ label: category.name, value: category.id }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Statement Date</Label>
        <Input type="date" {...form.register("statement_date")} name="statement_date" />
      </div>

      <div className="space-y-2">
        <Label>Due Date</Label>
        <Input type="date" {...form.register("due_date")} name="due_date" />
      </div>

      {state.message ? (
        <p className={`md:col-span-2 text-sm ${state.success ? "text-emerald-600" : "text-red-500"}`}>{state.message}</p>
      ) : null}
      <div className="md:col-span-2">
        <SubmitButton />
      </div>
    </form>
  );
}
