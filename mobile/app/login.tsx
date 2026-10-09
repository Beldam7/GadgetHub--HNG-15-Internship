import { View, Text, StyleSheet, Pressable } from "react-native";
import { Cpu, Sparkles, ShieldCheck, Zap, ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useState } from "react";
import { STORE_CONFIG } from "@/config";
import { colors, spacing, radius } from "@/config/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) {
      showToast(error, "error");
    } else {
      showToast("Signed in successfully!", "success");
      router.replace("/tabs/account");
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <ArrowLeft size={20} color={colors.textSecondary} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Cpu size={28} color={colors.white} />
          </View>
          <Text style={styles.welcome}>Welcome to {STORE_CONFIG.name}</Text>
          <Text style={styles.subtitle}>
            Sign in to shop, track orders, and get AI-powered recommendations
          </Text>
        </View>

        <View style={styles.card}>
          <Pressable
            style={[styles.googleBtn, loading && styles.googleBtnDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleIcon />
            <Text style={styles.googleBtnText}>
              {loading ? "Connecting..." : "Continue with Google"}
            </Text>
          </Pressable>

          <View style={styles.features}>
            <FeatureRow icon={ShieldCheck} text="Secure authentication via Google" />
            <FeatureRow icon={Zap} text="Fast checkout and order tracking" />
            <FeatureRow icon={Sparkles} text="AI-powered product recommendations" />
          </View>
        </View>

        <Text style={styles.terms}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Text>
        <Text style={styles.syncNote}>
          Your account and cart sync across the website and mobile app.
        </Text>
      </View>
    </View>
  );
}

function FeatureRow({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Icon size={18} color={colors.slate600} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function GoogleIcon() {
  return (
    <View style={{ width: 20, height: 20 }}>
      <Text style={{ fontSize: 18 }}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.lg },
  backBtn: { width: 40, height: 40, marginLeft: spacing.md, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
  logoContainer: { alignItems: "center", marginBottom: spacing.xl },
  logo: { width: 56, height: 56, borderRadius: radius.lg, backgroundColor: colors.slate900, alignItems: "center", justifyContent: "center" },
  welcome: { fontSize: 24, fontWeight: "700", color: colors.text, marginTop: 16 },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14,
  },
  googleBtnDisabled: { opacity: 0.6 },
  googleBtnText: { fontSize: 15, fontWeight: "600", color: colors.text },
  features: { marginTop: spacing.lg, gap: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  terms: { fontSize: 12, color: colors.slate400, textAlign: "center", marginTop: spacing.lg },
  syncNote: { fontSize: 12, color: colors.slate400, textAlign: "center", marginTop: 6 },
});
