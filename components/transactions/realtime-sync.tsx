"use client";

import { useStatementsRealtime } from "@/hooks/use-statements-realtime";

export function RealtimeSync({ userId }: { userId: string }) {
  useStatementsRealtime(userId);
  return null;
}
