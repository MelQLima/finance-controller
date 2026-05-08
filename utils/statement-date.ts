type StatementLike = Record<string, unknown>;

function isoDate(value: unknown) {
  if (typeof value !== "string" || value.length < 10) return null;
  return value.slice(0, 10);
}

export function getStatementDate(item: StatementLike) {
  return (
    isoDate(item.statement_date) ??
    isoDate(item.date) ??
    isoDate(item.due_date) ??
    isoDate(item.created_at) ??
    ""
  );
}

export function normalizeStatementDates<T extends StatementLike>(rows: T[]) {
  return rows.map((row) => ({ ...row, statement_date: getStatementDate(row) }));
}
