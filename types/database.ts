export type StatementType = "income" | "expense";
export type StatementStatus = "paid" | "pending" | "scheduled";
export type WishlistPriority = "low" | "medium" | "high";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: "checking" | "credit" | "cash" | "investment";
  initial_balance: number;
  current_balance: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  type: StatementType;
  created_at: string;
}

export interface Statement {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  description: string;
  amount: number;
  type: StatementType;
  status: StatementStatus;
  statement_date: string;
  due_date: string | null;
  installment_group_id: string | null;
  installment_number: number | null;
  installment_total: number | null;
  recurring_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringItem {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  description: string;
  amount: number;
  type: StatementType;
  day_of_month: number;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
  created_at: string;
}

export interface MonthlyForecast {
  id: string;
  user_id: string;
  month: string;
  projected_income: number;
  projected_expense: number;
  projected_balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShoppingWishlistItem {
  id: string;
  user_id: string;
  title: string;
  estimated_price: number;
  priority: WishlistPriority;
  desired_date: string | null;
  recommended_purchase_month: string | null;
  notes: string | null;
  purchased_at: string | null;
  created_at: string;
}

export type DbTables = {
  profiles: Profile;
  accounts: Account;
  categories: Category;
  statements: Statement;
  recurring_items: RecurringItem;
  monthly_forecasts: MonthlyForecast;
  shopping_wishlist: ShoppingWishlistItem;
};
