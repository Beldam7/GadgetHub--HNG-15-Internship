import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from "react-native";
import { User, Package, LogOut, Mail, Phone, ChevronRight, LogIn, ShoppingBag } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { getUserOrders } from "@/services/orderService";
import { updateProfile } from "@/services/profileService";
import { useToast } from "@/contexts/ToastContext";
import type { Order } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { colors, spacing, radius } from "@/config/theme";

export default function AccountScreen() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      const o = await getUserOrders();
      setOrders(o);
    } catch (err) {
      console.error("Orders load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadOrders();
    else setLoading(false);
  }, [user, loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadOrders(), refreshProfile()]);
  }, [loadOrders, refreshProfile]);

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <User size={48} color={colors.slate200} />
        <Text style={styles.emptyTitle}>Sign in to your account</Text>
        <Text style={styles.emptyDesc}>Same account works on website and app</Text>
        <Pressable style={styles.signInBtn} onPress={() => router.push("/login")}>
          <LogIn size={18} color={colors.white} />
          <Text style={styles.signInBtnText}>Sign In with Google</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.full_name || user.email || "U")[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.full_name || "My Account"}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
      </View>

      {/* Profile Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile Information</Text>
        <View style={styles.infoRow}>
          <Mail size={18} color={colors.slate400} />
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{user.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <User size={18} color={colors.slate400} />
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{profile?.full_name || "Not set"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Phone size={18} color={colors.slate400} />
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{profile?.phone || "Not set"}</Text>
        </View>
      </View>

      {/* Orders */}
      <View style={styles.card}>
        <View style={styles.ordersHeader}>
          <Text style={styles.cardTitle}>Order History ({orders.length})</Text>
          {orders.length > 0 && <ShoppingBag size={18} color={colors.slate400} />}
        </View>
        {loading ? (
          <Text style={styles.loadingText}>Loading orders...</Text>
        ) : orders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Package size={36} color={colors.slate200} />
            <Text style={styles.emptyOrdersText}>No orders yet</Text>
            <Pressable style={styles.shopBtn} onPress={() => router.push("/tabs/shop")}>
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </Pressable>
          </View>
        ) : (
          orders.map((order) => (
            <Pressable
              key={order.id}
              style={styles.orderItem}
              onPress={() => router.push(`/order/${order.order_number}`)}
            >
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>{order.order_number}</Text>
                <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                <View style={styles.orderMeta}>
                  <View style={[styles.orderStatus, (styles as any)[`status_${order.order_status}`] || styles.status_pending]}>
                    <Text style={styles.orderStatusText}>{order.order_status}</Text>
                  </View>
                  <Text style={styles.orderPayment}>
                    {order.payment_method.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
                <Text style={styles.orderItems}>{order.order_items?.length || 0} item(s)</Text>
                <ChevronRight size={16} color={colors.slate400} />
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* Sign Out */}
      <Pressable style={styles.signOutBtn} onPress={signOut}>
        <LogOut size={18} color={colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileHeader: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: spacing.md, paddingVertical: spacing.lg,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.slate900,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "700", color: colors.white },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700", color: colors.text },
  profileEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  card: {
    marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: colors.textSecondary, width: 50 },
  infoValue: { flex: 1, fontSize: 14, fontWeight: "500", color: colors.text },
  ordersHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  loadingText: { fontSize: 14, color: colors.textSecondary, textAlign: "center", paddingVertical: 20 },
  emptyOrders: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyOrdersText: { fontSize: 14, color: colors.textSecondary },
  shopBtn: { marginTop: 8, backgroundColor: colors.slate900, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.sm },
  shopBtnText: { color: colors.white, fontSize: 13, fontWeight: "600" },
  orderItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  orderInfo: { flex: 1 },
  orderNumber: { fontSize: 14, fontWeight: "600", color: colors.text },
  orderDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  orderMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  orderStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  status_confirmed: { backgroundColor: colors.successLight },
  status_delivered: { backgroundColor: colors.successLight },
  status_pending: { backgroundColor: colors.warningLight },
  status_shipped: { backgroundColor: "#dbeafe" },
  orderStatusText: { fontSize: 10, fontWeight: "600", color: colors.textSecondary, textTransform: "capitalize" },
  orderPayment: { fontSize: 11, color: colors.slate400, textTransform: "capitalize" },
  orderRight: { alignItems: "flex-end", gap: 2 },
  orderTotal: { fontSize: 15, fontWeight: "700", color: colors.text },
  orderItems: { fontSize: 11, color: colors.textSecondary },
  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: colors.errorLight,
    borderRadius: radius.md, paddingVertical: 14,
  },
  signOutText: { fontSize: 15, fontWeight: "600", color: colors.error },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 12 },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  signInBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16,
    backgroundColor: colors.slate900, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md,
  },
  signInBtnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
});
