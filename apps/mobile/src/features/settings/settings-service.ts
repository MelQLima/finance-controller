import type { ProfileSettingsSchema } from "@finance-controller/shared";
import { emailSettingsSchema, passwordSettingsSchema, profileSettingsSchema } from "@finance-controller/shared";
import { supabase } from "@/lib/supabase";
import { getCurrentUserIdOrThrow } from "@/lib/user-session";

export async function getSettingsData() {
  const userId = await getCurrentUserIdOrThrow();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, accountResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("accounts").select("*").eq("user_id", userId).limit(1).maybeSingle(),
  ]);

  if (profileResult.error) throw new Error(profileResult.error.message);
  if (accountResult.error) throw new Error(accountResult.error.message);

  return {
    email: user?.email ?? "",
    fullName:
      (profileResult.data as { full_name?: string | null; name?: string | null } | null)?.full_name ??
      (profileResult.data as { full_name?: string | null; name?: string | null } | null)?.name ??
      "",
    currency:
      ((profileResult.data as { currency?: string | null } | null)?.currency ??
        (accountResult.data as { currency?: string | null } | null)?.currency ??
        "BRL") as ProfileSettingsSchema["currency"],
  };
}

export async function updateProfileSettings(payload: ProfileSettingsSchema) {
  const userId = await getCurrentUserIdOrThrow();
  const parsed = profileSettingsSchema.safeParse(payload);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  let { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      currency: parsed.data.currency,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error?.message.includes("full_name") || error?.message.includes("currency")) {
    const fallback = await supabase
      .from("profiles")
      .update({
        name: parsed.data.full_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    error = fallback.error;
  }
  if (error) throw new Error(error.message);

  const currencyUpdate = await supabase
    .from("accounts")
    .update({
      currency: parsed.data.currency,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (currencyUpdate.error && !currencyUpdate.error.message.includes("currency")) {
    throw new Error(currencyUpdate.error.message);
  }
}

export async function updateEmailSettings(email: string) {
  const parsed = emailSettingsSchema.safeParse({ email });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "E-mail inválido");
  const { error } = await supabase.auth.updateUser({ email: parsed.data.email });
  if (error) throw new Error(error.message);
}

export async function updatePasswordSettings(password: string) {
  const parsed = passwordSettingsSchema.safeParse({ password });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Senha inválida");
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) throw new Error(error.message);
}
