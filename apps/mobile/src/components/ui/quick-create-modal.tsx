import { Modal, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuickCreateModalProps {
  open: boolean;
  title: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function QuickCreateModal({
  open,
  title,
  label,
  value,
  onChange,
  onClose,
  onConfirm,
  loading,
}: QuickCreateModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent
      statusBarTranslucent={Platform.OS === "android"}
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingLeft: Math.max(20, insets.left),
          paddingRight: Math.max(20, insets.right),
          paddingTop: Math.max(20, insets.top),
          paddingBottom: Math.max(20, insets.bottom),
          backgroundColor: colors.overlay,
        }}
      >
        <View
          style={{
            borderRadius: 24,
            backgroundColor: colors.cardMuted,
            padding: 18,
            gap: 12,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            shadowColor: colors.shadow,
            shadowOpacity: 0.3,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 8,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>{title}</Text>
          <Input label={label} value={value} onChangeText={onChange} autoFocus />
          <Button onPress={onConfirm} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
          <Pressable onPress={onClose} style={{ alignItems: "center", paddingVertical: 8 }}>
            <Text style={{ color: colors.mutedText }}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
