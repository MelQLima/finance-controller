import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@/theme/colors";

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline" | "danger";
}

export function Button({ children, onPress, disabled, variant = "primary" }: ButtonProps) {
  const isOutline = variant === "outline";
  const isDanger = variant === "danger";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        borderRadius: 22,
        borderWidth: 1,
        borderColor: isDanger ? "rgba(255, 124, 146, 0.35)" : isOutline ? colors.borderStrong : "rgba(74, 121, 255, 0.24)",
        backgroundColor: isOutline
          ? "rgba(28, 30, 46, 0.9)"
          : isDanger
            ? "rgba(227, 86, 112, 0.22)"
            : colors.primary,
        opacity: disabled ? 0.52 : pressed ? 0.92 : 1,
        paddingVertical: 16,
        paddingHorizontal: 18,
        alignItems: "center",
        shadowColor: colors.shadow,
        shadowOpacity: isOutline ? 0.16 : 0.34,
        shadowRadius: isOutline ? 10 : 22,
        shadowOffset: { width: 0, height: 12 },
        elevation: 7,
      })}
    >
      <Text style={{ color: isDanger ? colors.danger : isOutline ? colors.text : colors.primaryText, fontWeight: "800", fontSize: 15 }}>
        {children}
      </Text>
    </Pressable>
  );
}
