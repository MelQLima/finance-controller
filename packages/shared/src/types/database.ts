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
  /** Legado: mesmo papel de `day_of_month` em schemas antigos. */
  due_day?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  /** Nomes legados quando a tabela ainda usa `start_date` / `end_date`. */
  start_date?: string | null;
  end_date?: string | null;
  /** Presente só se a coluna existir no Supabase. */
  active?: boolean | null;
  is_active?: boolean | null;
  created_at: string;
  /** Agendamento (quando existir no banco). */
  frequency?: string | null;
  interval_months?: number | null;
  day_of_week?: number | null;
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
  /** Campos opcionais preenchidos no cliente (planejamento: parcelas, livre, investimento). */
  plan_installments?: number;
  plan_free_before_invest?: number;
  plan_invest_amount?: number;
  plan_closing_after_invest?: number;
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
