import { useMemo, useRef, type ReactNode } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

const windowHeight = Dimensions.get("window").height;

interface BottomSheetFrameProps {
  children: ReactNode;
  onRequestClose: () => void;
  /** Altura da zona que captura o arraste no topo (abaixo do indicador). */
  dragHandleHeight?: number;
  sheetStyle?: ViewStyle;
}

export function BottomSheetFrame({
  children,
  onRequestClose,
  dragHandleHeight = 56,
  sheetStyle,
}: BottomSheetFrameProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onRequestClose);
  onCloseRef.current = onRequestClose;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && g.dy > Math.abs(g.dx) * 0.7,
        onPanResponderGrant: () => {
          translateY.stopAnimation();
        },
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          const shouldDismiss = g.dy > 110 || (g.dy > 36 && g.vy > 900);
          if (shouldDismiss) {
            Animated.timing(translateY, {
              toValue: windowHeight,
              duration: 240,
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (finished) onCloseRef.current();
            });
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              friction: 7,
              tension: 80,
            }).start();
          }
        },
      }),
    [translateY],
  );

  return (
    <View style={styles.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} accessibilityRole="button" accessibilityLabel="Fechar" />
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
            paddingBottom: insets.bottom,
          },
          sheetStyle,
        ]}
      >
        <View style={[styles.handleZone, { height: dragHandleHeight }]} {...panResponder.panHandlers}>
          <View style={styles.pill} />
        </View>
        <View style={styles.body}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  sheet: {
    height: "88%",
    minHeight: 480,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  handleZone: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
  },
  pill: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(184, 176, 217, 0.45)",
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
});
