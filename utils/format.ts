export function formatCurrency(value: number, currency = "USD", locale = "en-US") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

export function formatMonthLabel(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(year, (monthIndex ?? 1) - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}
