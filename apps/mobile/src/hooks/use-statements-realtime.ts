import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useStatementsRealtime(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`statements-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "statements", filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["calendar"] });
        queryClient.invalidateQueries({ queryKey: ["forecast"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);
}
