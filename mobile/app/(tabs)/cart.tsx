import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl, Image } from "react-native";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, LogIn } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/utils";
import { STORE_CONFIG } from "@/config";
import { colors, spacing, radius } from "@/config/theme";

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, loading, refreshCart } = useCart();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const shippingFee = subtotal >= STORE_CONFIG.freeShippingThreshold ? 0 : subtotal > 0 ? STORE_CONFIG.shippingFee : 0;
  const total = subtotal + shippingFee;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCart();
    setRefreshing(false);
  }, [refreshCart]);

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <ShoppingBag size={48} color={colors.slate200} />
        <Text style={styles.emptyTitle}>Sign in to view your cart</Text>
        <Text style={styles.emptyDesc}>Your cart is shared with the website</Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.push("/login")}>
          <LogIn size={16} color={colors.white} />
          <Text style={styles.emptyBtnText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ShoppingBag size={48} color={colors.slate200} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyDesc}>Browse gadgets and add something you like</Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.push("/tabs/shop")}>
          <Text style={styles.emptyBtnText}>Start Shopping</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Shopping Cart</Text>
      <Text style={styles.subtitle}>{items.length} item{items.length !== 1 ? "s" : ""} · Synced with website</Text>

      {/* Cart Items */}
      <View style={styles.itemsContainer}>
        {items.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            {item.product?.image_url && (
              <Pressable onPress={() => router.push(`/product/${item.product!.slug}`)}>
                <Image source={{ uri: item.product.image_url }} style={styles.itemImage} />
              </Pressable>
            )}
            <View style={styles.itemContent}>
              <Pressable onPress={() => router.push(`/product/${item.product!.slug}`)}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product?.name}</Text>
              </Pressable>
              <Text style={styles.itemPrice}>{formatPrice(item.product?.price || 0)}</Text>
              {item.product && item.product.stock_quantity < item.quantity && (
                <Text style={styles.stockWarning}>Only {item.product.stock_quantity} in stock</Text>
              )}
              <View style={styles.itemActions}>
                <View style={styles.qtyRow}>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={14} color={colors.textSecondary} />
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => item.product && updateQuantity(item.id, Math.min(item.product.stock_quantity, item.quantity + 1))}
                  >
                    <Plus size={14} color={colors.textSecondary} />
                  </Pressable>
                </View>
                <Pressable style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                  <Trash2 size={14} color={colors.error} />
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.itemTotal}>{formatPrice((item.product?.price || 0) * item.quantity)}</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={styles.summaryValue}>{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</Text>
        </View>
        {shippingFee > 0 && (
          <Text style={styles.freeShipHint}>
            Add {formatPrice(STORE_CONFIG.freeShippingThreshold - subtotal)} more for free shipping
          </Text>
        )}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
      </View>

      {/* Checkout */}
      <Pressable style={styles.checkoutBtn} onPress={() => router.push("/checkout")}>
        <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        <ArrowRight size={18} color={colors.white} />
      </Pressable>

      <Pressable style={styles.continueBtn} onPress={() => router.push("/tabs/shop")}>
        <Text style={styles.continueBtnText}>Continue Shopping</Text>
      </Pressable>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  subtitle: { fontSize: 13, color: colors.textSecondary, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  itemsContainer: { paddingHorizontal: spacing.md, gap: 10 },
  cartItem: {
    flexDirection: "row", gap: 12, backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12,
  },
  itemImage: { width: 72, height: 72, borderRadius: radius.sm, resizeMode: "cover" },
  itemContent: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: colors.text, lineHeight: 18 },
  itemPrice: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  stockWarning: { fontSize: 12, color: colors.error, marginTop: 2 },
  itemActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  qtyRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm },
  qtyBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 14, fontWeight: "600", color: colors.text, minWidth: 28, textAlign: "center" },
  removeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  removeText: { fontSize: 12, color: colors.error, fontWeight: "500" },
  itemTotal: { fontSize: 16, fontWeight: "700", color: colors.text },
  summary: {
    margin: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  summaryTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: "600", color: colors.text },
  freeShipHint: { fontSize: 12, color: colors.slate400, marginTop: 4 },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: 18, fontWeight: "700", color: colors.text },
  checkoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: spacing.md, backgroundColor: colors.slate900,
    borderRadius: radius.md, paddingVertical: 14,
  },
  checkoutBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  continueBtn: { alignItems: "center", paddingVertical: 14, marginTop: 8 },
  continueBtnText: { fontSize: 14, fontWeight: "500", color: colors.textSecondary },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 12 },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: "center" },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16,
    backgroundColor: colors.slate900, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md,
  },
  emptyBtnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
});
