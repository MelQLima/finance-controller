export function formatCurrency(value: number, currency = "BRL", locale = "pt-BR") {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    /** Evita formato contábil com parênteses em alguns ambientes; o sinal negativo fica explícito. */
    currencySign: "standard",
  }).format(value);
}

export function formatMonthLabel(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(year, (monthIndex ?? 1) - 1, 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
}
