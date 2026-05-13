import type { ReactNode } from "react";
import { Text } from "react-native";
import { colors } from "@/theme/colors";

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 34,
        lineHeight: 40,
        fontWeight: "800",
        letterSpacing: -1.1,
        color: colors.text,
      }}
    >
      {children}
    </Text>
  );
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={{ color: colors.mutedText, fontSize: 15, lineHeight: 24 }}>{children}</Text>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        color: colors.primary,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        letterSpacing: 1.6,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={{ color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: "700" }}>{children}</Text>;
}
