import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Link, usePathname } from "expo-router";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { bottomScrollPaddingWithFloatingNav } from "@/theme/layout";

interface AppScreenProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Quando definido, permite `scrollTo` no conteúdo (ex.: focar o dia atual na agenda). */
  scrollViewRef?: RefObject<ScrollView | null>;
}

const navItems = [
  {
    href: "/(app)/dashboard",
    segment: "dashboard",
    label: "Início",
    icon: "view-grid-outline" as const,
  },
  {
    href: "/(app)/calendar",
    segment: "calendar",
    label: "Agenda",
    icon: "calendar-month-outline" as const,
  },
  {
    href: "/(app)/forecast",
    segment: "forecast",
    label: "Análise",
    icon: "chart-donut" as const,
  },
  {
    href: "/(app)/wishlist",
    segment: "wishlist",
    label: "Metas",
    icon: "flag-outline" as const,
  },
];

export function AppScreen({
  eyebrow,
  title,
  subtitle,
  children,
  scrollViewRef,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollBottomPad = bottomScrollPaddingWithFloatingNav(insets.bottom, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 18,
          paddingBottom: scrollBottomPad,
          gap: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        <TopBar />
        <View style={{ gap: 8 }}>
          <Text
            style={{
              color: colors.mutedText,
              fontSize: 11,
              fontWeight: "800",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 34,
              lineHeight: 40,
              fontWeight: "800",
              letterSpacing: -1.1,
            }}
          >
            {title}
          </Text>
          <Text
            style={{ color: colors.mutedText, fontSize: 15, lineHeight: 24 }}
          >
            {subtitle}
          </Text>
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

function TopBar() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            backgroundColor: colors.backgroundSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.primaryText, fontWeight: "800" }}>
            M
          </Text>
        </View>
        <View>
          <Text style={{ color: colors.mutedText, fontSize: 11 }}>
            Bem-vindo de volta
          </Text>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: "800" }}>
            Finance Controller
          </Text>
        </View>
      </View>

      <Link href="/(app)/settings" asChild>
        <Pressable
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={24}
            color={colors.text}
          />
        </Pressable>
      </Link>
    </View>
  );
}

export function BottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const cleanPath = pathname.replace("/(app)", "");

  const isActiveSection = (segment: string) => {
    if (segment === "dashboard") {
      return cleanPath === "/" || cleanPath === "/dashboard";
    }
    return cleanPath === `/${segment}` || cleanPath.startsWith(`/${segment}/`);
  };

  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 12 + insets.bottom,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.cardMuted,
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: colors.shadow,
        shadowOpacity: 0.34,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
        elevation: 10,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          justifyContent: "space-around",
        }}
      >
        {navItems.slice(0, 2).map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={isActiveSection(item.segment)}
          />
        ))}
      </View>

      <Link href="/(app)/transactions/new" asChild>
        <Pressable
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: 10,
            shadowColor: colors.shadow,
            shadowOpacity: 0.3,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 10 },
            elevation: 8,
          }}
        >
          <MaterialCommunityIcons
            name="plus"
            size={34}
            color={colors.primaryText}
          />
        </Pressable>
      </Link>

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          justifyContent: "space-around",
        }}
      >
        {navItems.slice(2).map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={isActiveSection(item.segment)}
          />
        ))}
      </View>
    </View>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  active: boolean;
}) {
  const iconAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const dotAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconAnim, {
        toValue: active ? 1 : 0,
        duration: 50,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(dotAnim, {
        toValue: active ? 1 : 0,
        duration: 50,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, dotAnim, iconAnim]);

  return (
    <Link href={href as never} asChild>
      <Pressable
        style={{
          alignItems: "center",
          gap: 5,
          minWidth: 62,
          paddingVertical: 6,
          paddingBottom: 14,
          position: "relative",
        }}
      >
        <Animated.View
          style={{
            height: 24,
            justifyContent: "center",
            opacity: iconAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.82, 1],
            }),
            transform: [
              {
                translateY: iconAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -4],
                }),
              },
              {
                scale: iconAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.08],
                }),
              },
            ],
          }}
        >
          <MaterialCommunityIcons
            name={icon}
            size={24}
            color={active ? colors.primary : colors.mutedText}
          />
        </Animated.View>
        <Text
          style={{
            color: active ? colors.text : colors.mutedText,
            fontSize: 11,
            fontWeight: "700",
          }}
        >
          {label}
        </Text>
        <Animated.View
          style={{
            position: "absolute",
            bottom: 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: active ? colors.primary : "transparent",
            opacity: dotAnim,
            transform: [
              {
                scale: dotAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                }),
              },
            ],
          }}
        />
      </Pressable>
    </Link>
  );
}
