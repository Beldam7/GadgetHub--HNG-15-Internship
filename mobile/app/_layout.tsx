import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastView } from "@/components/ToastView";
import { colors } from "@/config/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="product/[slug]" options={{ presentation: "card" }} />
              <Stack.Screen name="order/[orderNumber]" options={{ presentation: "card" }} />
              <Stack.Screen name="checkout" options={{ presentation: "card" }} />
              <Stack.Screen name="login" options={{ presentation: "fullScreenModal" }} />
              <Stack.Screen name="auth/callback" options={{ presentation: "card" }} />
            </Stack>
            <ToastView />
          </SafeAreaView>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
