import { z } from "zod";

export const authSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
});

export const transactionSchema = z.object({
  id: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().uuid("ID da transação inválido").optional(),
  ),
  description: z.string().min(2, "Descrição obrigatória"),
  amount: z.coerce.number().positive("O valor precisa ser maior que zero"),
  type: z.enum(["income", "expense"]),
  status: z.enum(["paid", "pending", "scheduled"]),
  account_id: z.string().trim().min(1, "Conta obrigatória").uuid("Conta inválida — selecione novamente"),
  category_id: z.string().trim().min(1, "Categoria obrigatória").uuid("Categoria inválida — selecione novamente"),
  statement_date: z.string().min(1, "Data obrigatória"),
  due_date: z.string().optional(),
  installments: z.preprocess((val) => {
    if (val === "" || val === undefined || val === null) return 1;
    const n = typeof val === "string" ? Number.parseInt(val.replace(/\D/g, ""), 10) : Math.floor(Number(val));
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(60, n);
  }, z.number().int().min(1).max(60)),
});

export const recurringItemSchema = z
  .object({
    description: z.string().min(2, "Descrição obrigatória"),
    amount: z.coerce.number().positive("O valor precisa ser maior que zero"),
    type: z.enum(["income", "expense"]),
    account_id: z.string().trim().min(1, "Conta obrigatória").uuid("Conta inválida — selecione novamente"),
    category_id: z.string().trim().min(1, "Categoria obrigatória").uuid("Categoria inválida — selecione novamente"),
    day_of_month: z.coerce.number().min(1).max(31),
    interval_months: z.coerce.number().min(1).max(60).optional(),
    day_of_week: z.coerce.number().min(0).max(6).optional(),
    schedule_preset: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly", "custom"]),
    starts_at: z.string().min(1, "Data de início obrigatória"),
    ends_at: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.schedule_preset === "weekly") {
      if (data.day_of_week === undefined || Number.isNaN(data.day_of_week)) {
        ctx.addIssue({
          code: "custom",
          message: "Selecione o dia da semana",
          path: ["day_of_week"],
        });
      }
    }
    if (data.schedule_preset === "custom") {
      const n = data.interval_months;
      if (n === undefined || Number.isNaN(n) || n < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Informe de 1 a 60 quantos meses entre cada ocorrência",
          path: ["interval_months"],
        });
      }
    }
  });

export const wishlistSchema = z.object({
  title: z.string().min(2, "Nome do item obrigatório"),
  estimated_price: z.coerce.number().positive("O valor precisa ser maior que zero"),
  priority: z.enum(["low", "medium", "high"]),
  desired_date: z.string().optional(),
  notes: z.string().max(240).optional(),
});

export const profileSettingsSchema = z.object({
  full_name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(80, "Nome muito longo"),
  currency: z.enum(["BRL", "USD", "EUR", "GBP"], { message: "Selecione uma moeda válida" }),
});

export const emailSettingsSchema = z.object({
  email: z.email("Informe um e-mail válido"),
});

export const passwordSettingsSchema = z.object({
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
});

export type AuthSchema = z.infer<typeof authSchema>;
export type TransactionSchema = z.infer<typeof transactionSchema>;
export type RecurringItemSchema = z.infer<typeof recurringItemSchema>;
export type WishlistSchema = z.infer<typeof wishlistSchema>;
export type ProfileSettingsSchema = z.infer<typeof profileSettingsSchema>;
export type EmailSettingsSchema = z.infer<typeof emailSettingsSchema>;
export type PasswordSettingsSchema = z.infer<typeof passwordSettingsSchema>;
