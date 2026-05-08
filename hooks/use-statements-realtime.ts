"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useStatementsRealtime(userId?: string) {
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`statements-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "statements", filter: `user_id=eq.${userId}` },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, userId]);
}
