/**
 * Heuristics for Brazilian banking push notifications (title + body).
 * Banks vary copy; tune regexes as you observe real payloads.
 */

export type InferredNotificationDirection = "income" | "expense" | "unknown";

const DIACRITICS = /[\u0300-\u036f]/g;

export function normalizeBrazilianNotificationText(...parts: (string | undefined | null)[]): string {
  return parts
    .filter((p): p is string => typeof p === "string" && p.length > 0)
    .join(" ")
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function brazilianMoneyToNumber(captured: string): number | null {
  const compact = captured.replace(/\./g, "").replace(",", ".");
  const n = Number(compact);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * First plausible BRL amount in the string (R$ 1.234,56 or 1.234,56).
 */
export function extractPrimaryAmountBRL(text: string): number | null {
  const s = text.replace(/\u00a0/g, " ");

  const withSymbolCents = s.match(/r\$\s*([\d]{1,3}(?:\.[\d]{3})*,\d{2})\b/i);
  if (withSymbolCents) {
    const n = brazilianMoneyToNumber(withSymbolCents[1]);
    if (n !== null) return n;
  }

  const withSymbolWholeReais = s.match(/\br\$\s*(\d+)\b/i);
  if (withSymbolWholeReais) {
    const n = Number(withSymbolWholeReais[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const bare = s.match(/\b([\d]{1,3}(?:\.[\d]{3})+,\d{2})\b/);
  if (bare) {
    const n = brazilianMoneyToNumber(bare[1]);
    if (n !== null) return n;
  }

  const simple = s.match(/\b(\d+,\d{2})\b/);
  if (simple) {
    const n = brazilianMoneyToNumber(simple[1]);
    if (n !== null) return n;
  }

  return null;
}

/** Longer / more specific patterns first to reduce false positives. */
const INCOME_PATTERNS: RegExp[] = [
  /\bpix\s+recebido\b/,
  /\btransferencia\s+pix\s+recebida\b/,
  /\btransferencia\s+recebida\b/,
  /\bted\s+recebida\b/,
  /\bdoc\s+recebida\b/,
  /\bvoce\s+recebeu\b/,
  /\bvc\s+recebeu\b/,
  /\brecebeu\s+um\s+pix\b/,
  /\bcredito\s+em\s+conta\b/,
  /\bvalor\s+creditado\b/,
  /\bcredito\s+realizado\b/,
  /\bdeposito\s+identificado\b/,
  /\bdeposito\s+recebido\b/,
  /\bentrada\s+de\s+pix\b/,
  /\brecebimento\s+de\s+pix\b/,
  /\bpix\s+creditado\b/,
  /\bincoming\s+transfer\b/,
  /\breceived\s+pix\b/i,
  /\breceived\s+money\b/i,
  /\byou\s+received\b/,
  /\bmoney\s+received\b/i,
];

const EXPENSE_PATTERNS: RegExp[] = [
  /\bpix\s+enviado\b/,
  /\btransferencia\s+pix\s+enviada\b/,
  /\btransferencia\s+enviada\b/,
  /\bvoce\s+pagou\b/,
  /\bvoce\s+enviou\b/,
  /\bvc\s+pagou\b/,
  /\benviou\s+um\s+pix\b/,
  /\bpix\s+realizado\b/,
  /\bcompra\s+aprovada\b/,
  /\bcompra\s+realizada\b/,
  /\bcompra\s+no\s+cartao\b/,
  /\bpagamento\s+aprovado\b/,
  /\bpagamento\s+realizado\b/,
  /\bpagamento\s+efetuado\b/,
  /\bdebito\s+em\s+conta\b/,
  /\bdebito\s+realizado\b/,
  /\bvalor\s+debitado\b/,
  /\bsaque\s+realizado\b/,
  /\bsaque\s+aprovado\b/,
  /\bcobranca\s+paga\b/,
  /\bfatura\s+fechada\b/,
  /\boutgoing\s+transfer\b/,
  /\bsent\s+pix\b/i,
  /\byou\s+paid\b/i,
  /\byou\s+sent\b/i,
  /\bpayment\s+sent\b/i,
  /\bpurchase\s+successful\b/i,
];

export function inferStatementTypeFromBrazilianNotificationText(text: string): InferredNotificationDirection {
  const t = normalizeBrazilianNotificationText(text);
  if (!t) return "unknown";

  for (const re of INCOME_PATTERNS) {
    if (re.test(t)) return "income";
  }
  for (const re of EXPENSE_PATTERNS) {
    if (re.test(t)) return "expense";
  }

  if (/\bdebitado\b/.test(t)) return "expense";

  return "unknown";
}

export function inferNotificationFinancialSummary(input: {
  title?: string | null;
  body?: string | null;
}): {
  direction: InferredNotificationDirection;
  amount: number | null;
  combinedText: string;
} {
  const combinedText = [input.title, input.body].filter(Boolean).join("\n");
  const direction = inferStatementTypeFromBrazilianNotificationText(combinedText);
  const amount = extractPrimaryAmountBRL(combinedText);
  return { direction, amount, combinedText };
}
