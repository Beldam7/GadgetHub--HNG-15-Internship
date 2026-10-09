import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { CheckCircle2, Package, Mail, ArrowRight, Truck } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getOrderByNumber } from "@/services/orderService";
import type { Order } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { LoadingSpinner } from "@/components/Skeletons";
import { colors, spacing, radius } from "@/config/theme";

export default function OrderSuccessScreen() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!orderNumber) return;
      try {
        const o = await getOrderByNumber(orderNumber);
        setOrder(o);
      } catch (err) {
        console.error("Order load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderNumber]);

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background }}><LoadingSpinner /></View>;

  if (!order) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>Order not found</Text>
        <Pressable style={styles.backBtn} onPress={() => router.replace("/tabs/home")}>
          <Text style={styles.backBtnText}>Go Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Success */}
      <View style={styles.successHeader}>
        <View style={styles.successIcon}>
          <CheckCircle2 size={40} color={colors.success} />
        </View>
        <Text style={styles.successTitle}>Order Confirmed!</Text>
        <Text style={styles.successDesc}>Thank you for your purchase.</Text>
      </View>

      {/* Order Info */}
      <View style={styles.card}>
        <InfoRow label="Order Number" value={order.order_number} />
        <InfoRow label="Order Date" value={formatDate(order.created_at)} />
        <InfoRow label="Customer" value={order.customer_name} />
        <InfoRow label="Payment Method" value={order.payment_method.replace(/_/g, " ")} capitalize />
        <InfoRow label="Order Status" value={order.order_status} badge />
        <InfoRow label="Total" value={formatPrice(order.total)} bold />
      </View>

      {/* Email Status */}
      <View style={[styles.emailCard, order.email_status === "sent" ? styles.emailSent : order.email_status === "failed" ? styles.emailFailed : styles.emailPending]}>
        <Mail size={20} color={order.email_status === "sent" ? colors.success : order.email_status === "failed" ? colors.warning : colors.slate600} />
        <Text style={styles.emailText}>
          {order.email_status === "sent" ? `Confirmation email sent to ${order.customer_email}` :
           order.email_status === "failed" ? "Email could not be sent, but your order is confirmed" :
           `Sending confirmation to ${order.customer_email}...`}
        </Text>
      </View>

      {/* Order Items */}
      {order.order_items && order.order_items.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Items</Text>
          {order.order_items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity} × {formatPrice(item.product_price)}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.subtotal)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping</Text>
            <Text style={styles.totalValue}>{order.shipping_fee === 0 ? "Free" : formatPrice(order.shipping_fee)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatPrice(order.total)}</Text>
          </View>
        </View>
      )}

      {/* Shipping Address */}
      <View style={styles.card}>
        <View style={styles.shipHeader}>
          <Truck size={18} color={colors.slate700} />
          <Text style={styles.cardTitle}>Shipping Address</Text>
        </View>
        <Text style={styles.shipText}>{order.customer_name}</Text>
        <Text style={styles.shipText}>{order.shipping_address}</Text>
        <Text style={styles.shipText}>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code || ""}</Text>
        <Text style={styles.shipText}>{order.shipping_country}</Text>
      </View>

      {/* Next Steps */}
      <View style={styles.nextStepsCard}>
        <View style={styles.nextStepsHeader}>
          <Package size={16} color={colors.text} />
          <Text style={styles.nextStepsTitle}>What happens next?</Text>
        </View>
        <Text style={styles.nextStepsText}>1. We'll process and pack your order within 1-2 business days</Text>
        <Text style={styles.nextStepsText}>2. You'll receive a shipping notification with tracking</Text>
        <Text style={styles.nextStepsText}>3. Your order will be delivered to the address above</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.secondaryBtn} onPress={() => router.replace("/tabs/account")}>
          <Text style={styles.secondaryBtnText}>View Orders</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace("/tabs/shop")}>
          <Text style={styles.primaryBtnText}>Continue Shopping</Text>
          <ArrowRight size={16} color={colors.white} />
        </Pressable>
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value, bold, capitalize, badge }: { label: string; value: string; bold?: boolean; capitalize?: boolean; badge?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {badge ? (
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{value}</Text>
        </View>
      ) : (
        <Text style={[styles.infoValue, bold && styles.infoValueBold, capitalize && { textTransform: "capitalize" }]}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  successHeader: { alignItems: "center", paddingTop: spacing.xl, paddingBottom: spacing.lg },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successLight, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 24, fontWeight: "700", color: colors.text, marginTop: 12 },
  successDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  card: { margin: spacing.md, marginBottom: 0, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: "500", color: colors.text },
  infoValueBold: { fontSize: 16, fontWeight: "700" },
  statusBadge: { backgroundColor: colors.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  statusBadgeText: { fontSize: 11, fontWeight: "600", color: colors.success, textTransform: "capitalize" },
  emailCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, margin: spacing.md, marginBottom: 0, borderRadius: radius.md, padding: 12 },
  emailSent: { backgroundColor: colors.successLight },
  emailFailed: { backgroundColor: colors.warningLight },
  emailPending: { backgroundColor: colors.slate100 },
  emailText: { flex: 1, fontSize: 13, fontWeight: "500", color: colors.text },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  itemName: { fontSize: 14, fontWeight: "500", color: colors.text },
  itemQty: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: "600", color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalLabel: { fontSize: 14, color: colors.textSecondary },
  totalValue: { fontSize: 14, fontWeight: "600", color: colors.text },
  grandTotalLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  grandTotalValue: { fontSize: 18, fontWeight: "700", color: colors.text },
  shipHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  shipText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  nextStepsCard: { margin: spacing.md, marginBottom: 0, backgroundColor: colors.slate100, borderRadius: radius.md, padding: 14 },
  nextStepsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  nextStepsTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  nextStepsText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 10, margin: spacing.md },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  secondaryBtnText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  primaryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.slate900, borderRadius: radius.md, paddingVertical: 14 },
  primaryBtnText: { fontSize: 14, fontWeight: "600", color: colors.white },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  notFoundTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  backBtn: { marginTop: 12, backgroundColor: colors.slate900, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md },
  backBtnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
});
