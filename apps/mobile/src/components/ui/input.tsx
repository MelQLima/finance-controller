import { Text, TextInput, type TextInputProps, View } from "react-native";
import { colors } from "@/theme/colors";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.mutedText, fontWeight: "700", fontSize: 13, letterSpacing: 0.3 }}>{label}</Text>
      <TextInput
        placeholderTextColor="rgba(159, 165, 192, 0.72)"
        {...props}
        style={{
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: "rgba(24, 25, 38, 0.92)",
          color: colors.text,
          fontSize: 15,
          shadowColor: colors.shadow,
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
        }}
      />
      {error ? <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
}
