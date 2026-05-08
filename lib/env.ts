const required = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

export const env = {
  // Use direct property access so Next can inline NEXT_PUBLIC vars in client bundles.
  NEXT_PUBLIC_SUPABASE_URL: required(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ),
};
