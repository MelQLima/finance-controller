"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { useFormStatus } from "react-dom";
import { z } from "zod";
import { createRecurringItemAction } from "@/app/actions/recurring";
import { defaultActionState } from "@/lib/actions/result";
import type { Account, Category } from "@/types";
import { recurringItemSchema } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface RecurringFormProps {
  accounts: Account[];
  categories: Category[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating..." : "Create recurring item"}
    </Button>
  );
}

export function RecurringForm({ accounts, categories }: RecurringFormProps) {
  const [state, formAction] = useActionState(createRecurringItemAction, defaultActionState);
  const form = useForm<z.input<typeof recurringItemSchema>, unknown, z.output<typeof recurringItemSchema>>({
    resolver: zodResolver(recurringItemSchema),
    defaultValues: {
      description: "",
      amount: 0,
      type: "expense",
      account_id: "",
      category_id: "",
      day_of_month: 1,
      starts_at: new Date().toISOString().slice(0, 10),
      ends_at: "",
    },
  });

  return (
    <form action={formAction} className="space-y-4 rounded-[1.5rem] border border-border bg-muted/25 p-4">
      <div className="space-y-2">
        <Label>Description</Label>
        <Input {...form.register("description")} name="description" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input type="number" step="0.01" {...form.register("amount")} name="amount" />
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
      </div>
      <div className="space-y-2">
        <Label>Account</Label>
        <Select {...form.register("account_id")} name="account_id" options={accounts.map((a) => ({ label: a.name, value: a.id }))} />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          {...form.register("category_id")}
          name="category_id"
          options={categories.map((c) => ({ label: c.name, value: c.id }))}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Day of month</Label>
          <Input type="number" min={1} max={31} {...form.register("day_of_month")} name="day_of_month" />
        </div>
        <div className="space-y-2">
          <Label>Starts at</Label>
          <Input type="date" {...form.register("starts_at")} name="starts_at" />
        </div>
      </div>
      {state.message ? <p className={`text-sm ${state.success ? "text-emerald-600" : "text-red-500"}`}>{state.message}</p> : null}
      <SubmitButton />
    </form>
  );
}
