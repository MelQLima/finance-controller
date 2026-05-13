import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@fc_invest_pct_of_free_balance_v1";

export async function getInvestPercent(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return 0;
    const n = Number(raw);
    if (!Number.isFinite(n)) return 0;
    return Math.min(100, Math.max(0, n));
  } catch {
    return 0;
  }
}

export async function setInvestPercent(value: number): Promise<void> {
  const n = Math.min(100, Math.max(0, Math.round(value * 100) / 100));
  await AsyncStorage.setItem(STORAGE_KEY, String(n));
}
