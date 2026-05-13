import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import type { Edge } from "react-native-safe-area-context";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { bottomScrollPaddingWithFloatingNav, FLOATING_BOTTOM_NAV_EXTRA } from "@/theme/layout";

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Quando o pai já aplica área segura (ex.: header do Stack), omita `top` para não somar padding duplo. */
  safeAreaEdges?: readonly Edge[];
  /**
   * Telas dentro de `(app)` com BottomNav flutuante: padding extra no fundo do scroll
   * para botões/últimos campos não ficarem atrás da barra.
   */
  includeFloatingBottomInset?: boolean;
}

export function Screen({
  children,
  scroll = false,
  safeAreaEdges,
  includeFloatingBottomInset = false,
}: ScreenProps) {
  const edgeProps = safeAreaEdges ? { edges: safeAreaEdges } : {};
  const insets = useSafeAreaInsets();

  const scrollBottomPad = includeFloatingBottomInset
    ? bottomScrollPaddingWithFloatingNav(insets.bottom)
    : 40;

  const fixedBottomPad = includeFloatingBottomInset ? 16 + insets.bottom + FLOATING_BOTTOM_NAV_EXTRA : 16;

  if (scroll) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} {...edgeProps}>
        <ScrollView
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: scrollBottomPad, gap: 18 }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} {...edgeProps}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: fixedBottomPad, gap: 18 }}>{children}</View>
    </SafeAreaView>
  );
}
