import { z } from "zod";
import type { StatementType } from "../types/database";

export const quickNameSchema = z
  .string()
  .trim()
  .min(2, "Informe um nome com ao menos 2 caracteres")
  .max(60, "Nome muito longo");

export const basicCategoriesByType: Record<StatementType, string[]> = {
  expense: [
    "Alimentacao",
    "Saude",
    "Lazer",
    "Transporte",
    "Moradia",
    "Educacao",
    "Mercado",
    "Assinaturas",
    "Impostos",
  ],
  income: [
    "Salario",
    "Freelance",
    "Investimentos",
    "Reembolso",
    "Outras receitas",
  ],
};
