import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const getUserContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { user, supabase };
});

export async function getCurrentUser() {
  const { user } = await getUserContext();
  return user;
}

export async function getSupabaseForUser() {
  const { supabase } = await getUserContext();
  return supabase;
}
