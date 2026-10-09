import { View, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "@/config/theme";

export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.skeleton, styles.image]} />
      <View style={styles.content}>
        <View style={[styles.skeleton, { width: 60, height: 10 }]} />
        <View style={[styles.skeleton, { width: "100%", height: 14 }]} />
        <View style={[styles.skeleton, { width: 80, height: 12 }]} />
        <View style={[styles.skeleton, { width: 70, height: 18 }]} />
        <View style={[styles.skeleton, { width: "100%", height: 36 }]} />
      </View>
    </View>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function LoadingSpinner({ size = "large" }: { size?: "small" | "large" }) {
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={colors.slate900} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    margin: 4,
  },
  skeleton: {
    backgroundColor: colors.slate100,
    borderRadius: 6,
  },
  image: {
    aspectRatio: 1,
  },
  content: {
    padding: 12,
    gap: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  spinnerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
});
