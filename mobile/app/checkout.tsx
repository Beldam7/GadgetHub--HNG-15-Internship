import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert } from "react-native";
import { ArrowLeft, Truck, CreditCard, CheckCircle2, Loader2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createOrder } from "@/services/orderService";
import { formatPrice } from "@/lib/utils";
import { STORE_CONFIG } from "@/config";
import { colors, spacing, radius } from "@/config/theme";

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, refreshCart } = useCart();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: profile?.full_name || user?.email || "",
    customer_email: user?.email || "",
    customer_phone: profile?.phone || "",
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_country: "",
    shipping_postal_code: "",
    payment_method: "pay_on_delivery",
  });

  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const shippingFee = subtotal >= STORE_CONFIG.freeShippingThreshold ? 0 : STORE_CONFIG.shippingFee;
  const total = subtotal + shippingFee;

  function validate(): boolean {
    if (!form.customer_name.trim()) { showToast("Full name is required", "error"); return false; }
    if (!form.customer_email.trim()) { showToast("Email is required", "error"); return false; }
    if (!form.shipping_address.trim()) { showToast("Address is required", "error"); return false; }
    if (!form.shipping_city.trim()) { showToast("City is required", "error"); return false; }
    if (!form.shipping_state.trim()) { showToast("State is required", "error"); return false; }
    if (!form.shipping_country.trim()) { showToast("Country is required", "error"); return false; }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    const result = await createOrder({
      items: items.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      shipping_address: form.shipping_address,
      shipping_city: form.shipping_city,
      shipping_state: form.shipping_state,
      shipping_country: form.shipping_country,
      shipping_postal_code: form.shipping_postal_code,
      payment_method: form.payment_method,
    });
    setSubmitting(false);

    if (result.success && result.order) {
      await refreshCart();
      router.replace(`/order/${result.order.order_number}`);
    } else {
      showToast(result.error || "Failed to place order. Please try again.", "error");
    }
  }

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Sign in to checkout</Text>
        <Pressable style={styles.signInBtn} onPress={() => router.push("/login")}>
          <Text style={styles.signInBtnText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Pressable style={styles.signInBtn} onPress={() => router.push("/tabs/shop")}>
          <Text style={styles.signInBtnText}>Browse Products</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      {/* Customer Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Customer Information</Text>
        <Input label="Full Name *" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} />
        <Input label="Email *" value={form.customer_email} onChange={(v) => setForm({ ...form, customer_email: v })} keyboardType="email-address" />
        <Input label="Phone Number" value={form.customer_phone} onChange={(v) => setForm({ ...form, customer_phone: v })} keyboardType="phone-pad" />
      </View>

      {/* Shipping */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Shipping Address</Text>
        <Input label="Street Address *" value={form.shipping_address} onChange={(v) => setForm({ ...form, shipping_address: v })} />
        <View style={styles.inputRow}>
          <Input label="City *" value={form.shipping_city} onChange={(v) => setForm({ ...form, shipping_city: v })} flex1 />
          <Input label="State *" value={form.shipping_state} onChange={(v) => setForm({ ...form, shipping_state: v })} flex1 />
        </View>
        <View style={styles.inputRow}>
          <Input label="Country *" value={form.shipping_country} onChange={(v) => setForm({ ...form, shipping_country: v })} flex1 />
          <Input label="Postal Code" value={form.shipping_postal_code} onChange={(v) => setForm({ ...form, shipping_postal_code: v })} flex1 keyboardType="numeric" />
        </View>
      </View>

      {/* Payment */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>3. Payment Method</Text>
        <Pressable
          style={[styles.paymentOption, form.payment_method === "pay_on_delivery" && styles.paymentActive]}
          onPress={() => setForm({ ...form, payment_method: "pay_on_delivery" })}
        >
          <Truck size={20} color={colors.slate700} />
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentTitle}>Pay on Delivery</Text>
            <Text style={styles.paymentDesc}>Pay with cash or card on arrival</Text>
          </View>
          <View style={[styles.radio, form.payment_method === "pay_on_delivery" && styles.radioActive]} />
        </Pressable>
        <View style={[styles.paymentOption, styles.paymentDisabled]}>
          <CreditCard size={20} color={colors.slate400} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.paymentTitle, { color: colors.slate400 }]}>Online Payment (Coming Soon)</Text>
            <Text style={styles.paymentDesc}>Stripe, Paystack integration ready</Text>
          </View>
        </View>
      </View>

      {/* Order Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Summary</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.summaryItem}>
            <Text style={styles.summaryItemName} numberOfLines={1}>{item.product?.name}</Text>
            <Text style={styles.summaryItemQty}>×{item.quantity}</Text>
            <Text style={styles.summaryItemPrice}>{formatPrice((item.product?.price || 0) * item.quantity)}</Text>
          </View>
        ))}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={styles.summaryValue}>{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
      </View>

      {/* Place Order */}
      <Pressable style={[styles.placeOrderBtn, submitting && styles.btnDisabled]} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <Loader2 size={20} color={colors.white} /> : <CheckCircle2 size={20} color={colors.white} />}
        <Text style={styles.placeOrderText}>{submitting ? "Placing Order..." : "Place Order"}</Text>
      </Pressable>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function Input({ label, value, onChange, keyboardType, flex1 }: {
  label: string; value: string; onChange: (v: string) => void; keyboardType?: string; flex1?: boolean;
}) {
  return (
    <View style={[styles.inputContainer, flex1 && { flex: 1 }]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType as any || "default"}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  card: { margin: spacing.md, marginBottom: 0, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 },
  inputContainer: { marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: "500", color: colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text },
  inputRow: { flexDirection: "row", gap: 10 },
  paymentOption: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, marginBottom: 8 },
  paymentActive: { borderColor: colors.slate900, backgroundColor: colors.slate100 },
  paymentDisabled: { opacity: 0.5, borderStyle: "dashed" },
  paymentTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  paymentDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.slate200 },
  radioActive: { borderColor: colors.slate900, backgroundColor: colors.slate900 },
  summaryItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  summaryItemName: { flex: 1, fontSize: 13, color: colors.textSecondary },
  summaryItemQty: { fontSize: 13, color: colors.slate400 },
  summaryItemPrice: { fontSize: 13, fontWeight: "600", color: colors.text },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: "600", color: colors.text },
  totalLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: 18, fontWeight: "700", color: colors.text },
  placeOrderBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: spacing.md, backgroundColor: colors.slate900, borderRadius: radius.md, paddingVertical: 16 },
  placeOrderText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  signInBtn: { marginTop: 12, backgroundColor: colors.slate900, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md },
  signInBtnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
});
