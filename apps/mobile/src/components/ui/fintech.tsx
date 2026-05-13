import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export function Pill({
  children,
  active = false,
  tone = "default",
  onPress,
}: {
  children: ReactNode;
  active?: boolean;
  tone?: "default" | "success" | "danger" | "warning";
  onPress?: () => void;
}) {
  const palette =
    tone === "success"
      ? { bg: colors.successSoft, border: "rgba(131, 242, 192, 0.22)", text: colors.success }
      : tone === "danger"
        ? { bg: colors.dangerSoft, border: "rgba(255, 155, 177, 0.22)", text: colors.danger }
        : tone === "warning"
          ? { bg: colors.warningSoft, border: "rgba(240, 197, 139, 0.22)", text: colors.warning }
          : { bg: active ? "rgba(74, 121, 255, 0.22)" : "rgba(255,255,255,0.05)", border: colors.border, text: active ? colors.primaryText : colors.mutedText };

  const shellStyle = {
    alignSelf: "flex-start" as const,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
  };

  const label = (
    <Text style={{ color: palette.text, fontSize: 12, fontWeight: "800", letterSpacing: 0.2 }}>{children}</Text>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [shellStyle, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
      >
        {label}
      </Pressable>
    );
  }

  return <View style={shellStyle}>{label}</View>;
}

export function StatTile({
  label,
  value,
  helper,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 24,
        padding: 15,
        gap: 5,
        backgroundColor: accent ? "rgba(74, 121, 255, 0.18)" : "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: accent ? "rgba(74, 121, 255, 0.24)" : colors.border,
      }}
    >
      <Text style={{ color: colors.mutedText, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 21, fontWeight: "800", letterSpacing: -0.5 }}>{value}</Text>
      {helper ? <Text style={{ color: colors.mutedText, fontSize: 12 }}>{helper}</Text> : null}
    </View>
  );
}

export function SectionBar({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: "800" }}>{title}</Text>
      {action}
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  value,
  tone = "default",
}: {
  title: string;
  subtitle?: string;
  value?: ReactNode;
  tone?: "default" | "success" | "danger";
}) {
  return (
    <View
      style={{
        borderRadius: 22,
        padding: 15,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}>{title}</Text>
        {subtitle ? <Text style={{ color: colors.mutedText, fontSize: 12 }}>{subtitle}</Text> : null}
      </View>
      {value ? (
        <Text
          style={{
            color: tone === "success" ? colors.success : tone === "danger" ? colors.danger : colors.text,
            fontWeight: "800",
            fontSize: 14,
          }}
        >
          {value}
        </Text>
      ) : null}
    </View>
  );
}

export function EmptyPanel({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={{
        borderRadius: 24,
        padding: 18,
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>{title}</Text>
      <Text style={{ color: colors.mutedText, fontSize: 14, lineHeight: 21 }}>{subtitle}</Text>
    </View>
  );
}
