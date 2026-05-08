"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { useFormStatus } from "react-dom";
import { z } from "zod";
import { createWishlistItemAction } from "@/app/actions/wishlist";
import { defaultActionState } from "@/lib/actions/result";
import { wishlistSchema } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Saving..." : "Add to wishlist"}
    </Button>
  );
}

export function WishlistForm() {
  const [state, formAction] = useActionState(createWishlistItemAction, defaultActionState);
  const form = useForm<z.input<typeof wishlistSchema>, unknown, z.output<typeof wishlistSchema>>({
    resolver: zodResolver(wishlistSchema),
    defaultValues: {
      title: "",
      estimated_price: 0,
      priority: "medium",
      desired_date: "",
      notes: "",
    },
  });

  return (
    <form action={formAction} className="space-y-4 rounded-[1.5rem] border border-border bg-muted/25 p-4">
      <div className="space-y-2">
        <Label>Item name</Label>
        <Input {...form.register("title")} name="title" />
      </div>
      <div className="space-y-2">
        <Label>Estimated price</Label>
        <Input type="number" step="0.01" {...form.register("estimated_price")} name="estimated_price" />
      </div>
      <div className="space-y-2">
        <Label>Priority</Label>
        <Select
          {...form.register("priority")}
          name="priority"
          options={[
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
          ]}
        />
      </div>
      <div className="space-y-2">
        <Label>Desired date</Label>
        <Input type="date" {...form.register("desired_date")} name="desired_date" />
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Input {...form.register("notes")} name="notes" />
      </div>
      {state.message ? <p className={`text-sm ${state.success ? "text-emerald-600" : "text-red-500"}`}>{state.message}</p> : null}
      <SubmitButton />
    </form>
  );
}
