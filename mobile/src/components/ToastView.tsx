import { View, Text, StyleSheet, Pressable } from "react-native";
import { CheckCircle2, XCircle, Info, X } from "lucide-react-native";
import { useToast } from "@/contexts/ToastContext";
import { colors, radius, spacing } from "@/config/theme";

export function ToastView() {
  const { toast, clearToast } = useToast();

  if (!toast) return null;

  const bgColor =
    toast.type === "success" ? colors.success :
    toast.type === "error" ? colors.error :
    colors.slate900;

  const Icon = toast.type === "success" ? CheckCircle2 : toast.type === "error" ? XCircle : Info;

  return (
    <View style={styles.overlay}>
      <Pressable style={[styles.toast, { backgroundColor: bgColor }]} onPress={clearToast}>
        <Icon size={18} color={colors.white} />
        <Text style={styles.message}>{toast.message}</Text>
        <X size={14} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing.md,
    zIndex: 100,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: "100%",
  },
  message: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});
