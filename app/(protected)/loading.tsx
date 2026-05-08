export default function ProtectedLoading() {
  const placeholders = ["a", "b", "c", "d", "e", "f"];

  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {placeholders.map((id) => (
          <div key={id} className="h-32 animate-pulse rounded-2xl border border-border bg-muted/60" />
        ))}
      </div>
    </div>
  );
}
