import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import { env } from "./env";

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return (input as Request).url;
}

function resolveRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method;
  if (typeof input === "object" && !(input instanceof URL) && "method" in input) {
    return (input as Request).method;
  }
  return "GET";
}

/** Em __DEV__, loga método, URL, status e tempo no console (Metro + `adb logcat ReactNativeJS`). */
function createDevLoggedFetch(): typeof fetch {
  return async (input, init) => {
    const url = resolveRequestUrl(input);
    const method = resolveRequestMethod(input, init);
    const tag = "[Supabase HTTP]";
    console.log(tag, "→", method, url);
    const started = Date.now();
    try {
      const response = await fetch(input, init);
      console.log(tag, "←", response.status, method, url, `${Date.now() - started}ms`);
      return response;
    } catch (error) {
      console.log(tag, "ERR", method, url, error);
      throw error;
    }
  };
}

const clientOptions: SupabaseClientOptions<any> = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
};

if (__DEV__) {
  clientOptions.global = { fetch: createDevLoggedFetch() };
}

export const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, clientOptions);
