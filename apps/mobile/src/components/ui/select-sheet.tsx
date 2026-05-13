import { useMemo, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectSheetProps {
  label: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  error?: string;
}

export function SelectSheet({ label, value, placeholder = "Selecionar", options, onSelect, error }: SelectSheetProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedLabel = useMemo(() => options.find((item) => item.value === value)?.label ?? "", [options, value]);

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.mutedText, fontWeight: "700", fontSize: 13, letterSpacing: 0.2 }}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 15,
          backgroundColor: "rgba(18, 16, 34, 0.72)",
        }}
      >
        <Text style={{ color: selectedLabel ? colors.text : "rgba(184, 176, 217, 0.7)", fontSize: 15 }}>{selectedLabel || placeholder}</Text>
      </Pressable>
      {error ? <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text> : null}

      <Modal
        visible={open}
        animationType="slide"
        transparent
        statusBarTranslucent={Platform.OS === "android"}
        presentationStyle="overFullScreen"
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}>
          <View
            style={{
              maxHeight: "70%",
              backgroundColor: colors.backgroundStrong,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 20,
              paddingBottom: 20 + insets.bottom,
              gap: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontWeight: "800", color: colors.text, fontSize: 18 }}>{label}</Text>
            <ScrollView contentContainerStyle={{ gap: 8 }}>
              {options.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: item.value === value ? colors.primary : colors.border,
                    backgroundColor: item.value === value ? "rgba(111, 84, 255, 0.24)" : colors.card,
                    borderRadius: 18,
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: item.value === value ? "700" : "500" }}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setOpen(false)}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 18,
                paddingVertical: 14,
                alignItems: "center",
                backgroundColor: "rgba(18, 16, 34, 0.72)",
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "600" }}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
