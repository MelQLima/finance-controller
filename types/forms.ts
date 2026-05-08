import { z } from "zod";

export const authSchema = z.object({
  email: z.email("Provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const transactionSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(2, "Description is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  type: z.enum(["income", "expense"]),
  status: z.enum(["paid", "pending", "scheduled"]),
  account_id: z.string().min(1, "Account is required"),
  category_id: z.string().min(1, "Category is required"),
  statement_date: z.string().min(1, "Date is required"),
  due_date: z.string().optional(),
  installments: z.coerce.number().min(1).max(60).default(1),
});

export const recurringItemSchema = z.object({
  description: z.string().min(2),
  amount: z.coerce.number().positive(),
  type: z.enum(["income", "expense"]),
  account_id: z.string().min(1),
  category_id: z.string().min(1),
  day_of_month: z.coerce.number().min(1).max(31),
  starts_at: z.string().min(1),
  ends_at: z.string().optional(),
});

export const wishlistSchema = z.object({
  title: z.string().min(2),
  estimated_price: z.coerce.number().positive(),
  priority: z.enum(["low", "medium", "high"]),
  desired_date: z.string().optional(),
  notes: z.string().max(240).optional(),
});

export type AuthSchema = z.infer<typeof authSchema>;
export type TransactionSchema = z.infer<typeof transactionSchema>;
export type RecurringItemSchema = z.infer<typeof recurringItemSchema>;
export type WishlistSchema = z.infer<typeof wishlistSchema>;
