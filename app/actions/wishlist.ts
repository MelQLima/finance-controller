"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/result";
import { wishlistSchema } from "@/types";
import { getCurrentUser } from "@/services/session";
import { getWishlistData } from "@/services/wishlist";

export async function createWishlistItemAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = wishlistSchema.safeParse({
    title: formData.get("title"),
    estimated_price: formData.get("estimated_price"),
    priority: formData.get("priority"),
    desired_date: formData.get("desired_date") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid wishlist item." };
  }

  const user = await getCurrentUser();
  const supabase = await createClient();

  const { forecasts } = await getWishlistData();
  const recommended =
    forecasts.find((item) => item.projected_balance >= parsed.data.estimated_price)?.month ?? null;

  const { error } = await supabase.from("shopping_wishlist").insert({
    user_id: user.id,
    title: parsed.data.title,
    estimated_price: parsed.data.estimated_price,
    priority: parsed.data.priority,
    desired_date: parsed.data.desired_date || null,
    notes: parsed.data.notes || null,
    recommended_purchase_month: recommended,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/wishlist");
  return { success: true, message: "Wishlist item created." };
}
