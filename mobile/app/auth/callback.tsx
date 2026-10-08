import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { colors, spacing } from "@/config/theme";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/tabs/account");
      } else {
        router.replace("/login");
      }
    }
  }, [loading, user, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.slate900} />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: 12 },
  text: { fontSize: 14, color: colors.textSecondary },
});
