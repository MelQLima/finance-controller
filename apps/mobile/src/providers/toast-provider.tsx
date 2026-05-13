import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { colors } from "@/theme/colors";

type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 2400);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 24,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor:
              toast.type === "success"
                ? colors.success
                : toast.type === "error"
                  ? colors.danger
                  : colors.primary,
          }}
        >
          <Text style={{ color: colors.primaryText, fontWeight: "600" }}>{toast.message}</Text>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
