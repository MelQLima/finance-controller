import type { ReactNode } from "react";
import { View } from "react-native";
import { colors } from "@/theme/colors";

interface CardProps {
  children: ReactNode;
  variant?: "default" | "muted" | "accent";
}

export function Card({ children, variant = "default" }: CardProps) {
  const isAccent = variant === "accent";
  const isMuted = variant === "muted";
  const backgroundColor = isAccent ? colors.cardAccent : isMuted ? colors.cardMuted : colors.card;

  return (
    <View
      style={{
        backgroundColor,
        borderColor: isAccent ? colors.borderStrong : colors.border,
        borderWidth: 1,
        borderRadius: 30,
        padding: 20,
        gap: 12,
        overflow: "hidden",
        shadowColor: colors.shadow,
        shadowOpacity: isAccent ? 0.34 : 0.28,
        shadowRadius: isAccent ? 28 : 20,
        shadowOffset: { width: 0, height: 14 },
        elevation: 8,
      }}
    >
      {children}
    </View>
  );
}
