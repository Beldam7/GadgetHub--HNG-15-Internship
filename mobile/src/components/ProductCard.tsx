import { Pressable, View, Text, Image, StyleSheet } from "react-native";
import { ShoppingCart, Eye } from "lucide-react-native";
import { useRouter } from "expo-router";
import type { Product } from "@/types";
import { formatPrice, getDiscountPercentage } from "@/lib/utils";
import { StarRating } from "@/components/StarRating";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { useState } from "react";
import { colors, radius, spacing } from "@/config/theme";

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);

  const discount = getDiscountPercentage(product.price, product.compare_at_price);
  const outOfStock = product.stock_quantity === 0;

  async function handleAddToCart() {
    setAdding(true);
    const { error } = await addToCart(product, 1);
    setAdding(false);
    if (error) {
      showToast(error, "error");
    } else {
      showToast("Added to cart!", "success");
    }
  }

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/product/${product.slug}`)}
    >
      <View style={styles.imageContainer}>
        {product.image_url && (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        )}
        <View style={styles.badges}>
          {discount > 0 && (
            <View style={[styles.badge, styles.discountBadge]}>
              <Text style={styles.badgeText}>-{discount}%</Text>
            </View>
          )}
          {product.is_new_arrival && (
            <View style={[styles.badge, styles.newBadge]}>
              <Text style={styles.badgeText}>New</Text>
            </View>
          )}
          {outOfStock && (
            <View style={[styles.badge, styles.stockBadge]}>
              <Text style={styles.badgeText}>Out of Stock</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {product.category && (
          <Text style={styles.category}>{product.category.name}</Text>
        )}
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <StarRating rating={product.rating} size={12} showNumber reviewCount={product.review_count} />
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.compare_at_price && (
            <Text style={styles.comparePrice}>{formatPrice(product.compare_at_price)}</Text>
          )}
        </View>
        <View style={styles.actions}>
          <Pressable
            style={[styles.cartBtn, (outOfStock || adding) && styles.disabled]}
            onPress={handleAddToCart}
            disabled={outOfStock || adding}
          >
            <ShoppingCart size={14} color={colors.white} />
            <Text style={styles.cartBtnText}>
              {adding ? "Adding..." : "Add to Cart"}
            </Text>
          </Pressable>
          <Pressable
            style={styles.viewBtn}
            onPress={() => router.push(`/product/${product.slug}`)}
          >
            <Eye size={14} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    margin: spacing.xs,
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: colors.slate100,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  badges: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  discountBadge: { backgroundColor: "#e11d48" },
  newBadge: { backgroundColor: "#16a34a" },
  stockBadge: { backgroundColor: "#475569" },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  content: {
    padding: spacing.sm,
    gap: 4,
  },
  category: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.slate400,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  comparePrice: {
    fontSize: 13,
    color: colors.slate400,
    textDecorationLine: "line-through",
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  cartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.slate900,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  cartBtnText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  viewBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
});
