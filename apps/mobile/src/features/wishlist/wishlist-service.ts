import type { MonthlyForecast, ShoppingWishlistItem, WishlistSchema } from "@finance-controller/shared";
import { fetchMergedMonthlyForecasts } from "@/features/forecast/merged-monthly-forecasts";
import { supabase } from "@/lib/supabase";

async function getUserIdOrThrow() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(userError?.message ?? "Usuário não autenticado");
  }

  return user.id;
}

function capacityAfterInvest(f: MonthlyForecast): number {
  return f.plan_closing_after_invest ?? f.projected_balance;
}

function recommendPurchaseMonth(targetPrice: number, forecasts: MonthlyForecast[]) {
  for (const forecast of forecasts) {
    if (capacityAfterInvest(forecast) >= targetPrice) {
      return forecast.month;
    }
  }
  return null;
}

export async function getWishlistData() {
  const userId = await getUserIdOrThrow();

  const [{ data: wishlist, error: wishlistError }, monthlyForecasts] = await Promise.all([
    supabase
      .from("shopping_wishlist")
      .select("*")
      .eq("user_id", userId)
      .is("purchased_at", null)
      .order("created_at", { ascending: false }),
    fetchMergedMonthlyForecasts(),
  ]);

  if (wishlistError) throw new Error(wishlistError.message);
  const wishlistWithRecommendation = ((wishlist ?? []) as ShoppingWishlistItem[]).map((item) => ({
    ...item,
    recommended_purchase_month:
      item.recommended_purchase_month ?? recommendPurchaseMonth(item.estimated_price, monthlyForecasts),
  }));

  return { wishlist: wishlistWithRecommendation, forecasts: monthlyForecasts };
}

export async function getWishlistItemById(id: string) {
  const userId = await getUserIdOrThrow();
  const { data, error } = await supabase.from("shopping_wishlist").select("*").eq("id", id).eq("user_id", userId).single();
  if (error || !data) return null;
  return data as ShoppingWishlistItem;
}

export async function upsertWishlistItem(payload: WishlistSchema, itemId?: string) {
  const userId = await getUserIdOrThrow();
  const { forecasts } = await getWishlistData();
  const recommended =
    forecasts.find((item) => capacityAfterInvest(item) >= payload.estimated_price)?.month ?? null;

  if (itemId) {
    const { error } = await supabase
      .from("shopping_wishlist")
      .update({
        title: payload.title,
        estimated_price: payload.estimated_price,
        priority: payload.priority,
        desired_date: payload.desired_date || null,
        notes: payload.notes || null,
        recommended_purchase_month: recommended,
      })
      .eq("id", itemId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("shopping_wishlist").insert({
    user_id: userId,
    title: payload.title,
    estimated_price: payload.estimated_price,
    priority: payload.priority,
    desired_date: payload.desired_date || null,
    notes: payload.notes || null,
    recommended_purchase_month: recommended,
  });

  if (error) throw new Error(error.message);
}

export async function deleteWishlistItem(id: string) {
  const userId = await getUserIdOrThrow();
  const { error } = await supabase.from("shopping_wishlist").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
}
