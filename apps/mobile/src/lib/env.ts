const required = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
};

export const env = {
  EXPO_PUBLIC_SUPABASE_URL: required(
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    "EXPO_PUBLIC_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)",
  ),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: required(
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "EXPO_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
  ),
};
