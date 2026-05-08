import { AppShell } from "@/components/layout/app-shell";
import { RealtimeSync } from "@/components/transactions/realtime-sync";
import { getCurrentUser } from "@/services/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <AppShell>
      <RealtimeSync userId={user.id} />
      {children}
    </AppShell>
  );
}
