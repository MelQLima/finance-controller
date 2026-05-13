import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export async function getCurrentUserOrThrow() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(error?.message ?? "Usuário não autenticado");
  }

  return user;
}

export async function getCurrentUserIdOrThrow() {
  const user = await getCurrentUserOrThrow();
  return user.id;
}

export function requireUser(user: User | null) {
  if (!user) {
    throw new Error("Usuário não autenticado");
  }
  return user;
}
