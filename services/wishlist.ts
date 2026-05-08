import type { MonthlyForecast, ShoppingWishlistItem } from "@/types";
import { getCurrentUser, getSupabaseForUser } from "@/services/session";

export async function getWishlistData() {
  const user = await getCurrentUser();
  const supabase = await getSupabaseForUser();

  const [{ data: wishlist }, { data: forecasts }] = await Promise.all([
    supabase
      .from("shopping_wishlist")
      .select("*")
      .eq("user_id", user.id)
      .is("purchased_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("monthly_forecasts")
      .select("*")
      .eq("user_id", user.id)
      .order("month", { ascending: true }),
  ]);

  const monthlyForecasts = (forecasts ?? []) as MonthlyForecast[];
  const wishlistWithRecommendation = ((wishlist ?? []) as ShoppingWishlistItem[]).map((item) => ({
    ...item,
    recommended_purchase_month:
      item.recommended_purchase_month ?? recommendPurchaseMonth(item.estimated_price, monthlyForecasts),
  }));

  return { wishlist: wishlistWithRecommendation, forecasts: monthlyForecasts };
}

function recommendPurchaseMonth(targetPrice: number, forecasts: MonthlyForecast[]) {
  for (const forecast of forecasts) {
    if (forecast.projected_balance >= targetPrice) {
      return forecast.month;
    }
  }
  return null;
}
