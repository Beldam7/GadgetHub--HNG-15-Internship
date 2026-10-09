import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Image, RefreshControl } from "react-native";
import { ArrowLeft, ShoppingCart, Zap, Check, Minus, Plus, Star, Truck, ShieldCheck, RotateCcw, Sparkles } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getProductBySlug, getRelatedProducts } from "@/services/productService";
import { getProductReviews } from "@/services/reviewService";
import type { Product, Review } from "@/types";
import { formatPrice, getDiscountPercentage, formatDate } from "@/lib/utils";
import { StarRating } from "@/components/StarRating";
import { ProductCard } from "@/components/ProductCard";
import { LoadingSpinner } from "@/components/Skeletons";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { colors, spacing, radius } from "@/config/theme";

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!slug) return;
    try {
      const p = await getProductBySlug(slug);
      setProduct(p);
      if (p) {
        setActiveImage(0);
        setQuantity(1);
        const [rel, revs] = await Promise.all([
          getRelatedProducts(p.category_id, p.id, 4),
          getProductReviews(p.id),
        ]);
        setRelated(rel);
        setReviews(revs);
      }
    } catch (err) {
      console.error("Product load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAddToCart() {
    if (!product) return;
    setAdding(true);
    const { error } = await addToCart(product, quantity);
    setAdding(false);
    if (error) showToast(error, "error");
    else showToast("Added to cart!", "success");
  }

  async function handleBuyNow() {
    if (!product) return;
    setAdding(true);
    const { error } = await addToCart(product, quantity);
    setAdding(false);
    if (error) showToast(error, "error");
    else router.push("/tabs/cart");
  }

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background }}><LoadingSpinner /></View>;

  if (!product) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>Product not found</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const discount = getDiscountPercentage(product.price, product.compare_at_price);
  const images = product.images && product.images.length > 0 ? product.images : [product.image_url].filter(Boolean) as string[];
  const outOfStock = product.stock_quantity === 0;
  const specs = Object.entries(product.specifications || {});

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: images[activeImage] }} style={styles.mainImage} resizeMode="cover" />
        <View style={styles.badges}>
          {discount > 0 && <View style={[styles.badge, styles.discountBadge]}><Text style={styles.badgeText}>-{discount}%</Text></View>}
          {product.is_new_arrival && <View style={[styles.badge, styles.newBadge]}><Text style={styles.badgeText}>New</Text></View>}
        </View>
      </View>

      {images.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnails}>
          {images.map((img, idx) => (
            <Pressable key={idx} onPress={() => setActiveImage(idx)}>
              <Image
                source={{ uri: img }}
                style={[styles.thumb, activeImage === idx && styles.thumbActive]}
                resizeMode="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Info */}
      <View style={styles.content}>
        {product.category && <Text style={styles.category}>{product.category.name}</Text>}
        <Text style={styles.name}>{product.name}</Text>
        <StarRating rating={product.rating} size={16} showNumber reviewCount={product.review_count} />

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.compare_at_price && (
            <Text style={styles.comparePrice}>{formatPrice(product.compare_at_price)}</Text>
          )}
        </View>

        <Text style={styles.description}>{product.description}</Text>

        {/* Stock */}
        <View style={styles.stockRow}>
          {outOfStock ? (
            <Text style={styles.stockOut}>Out of Stock</Text>
          ) : product.stock_quantity <= 10 ? (
            <Text style={styles.stockLow}>Only {product.stock_quantity} left in stock</Text>
          ) : (
            <View style={styles.stockOkRow}>
              <Check size={16} color={colors.success} />
              <Text style={styles.stockOk}>In Stock ({product.stock_quantity} available)</Text>
            </View>
          )}
        </View>

        {/* Quantity */}
        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View style={styles.qtyControl}>
            <Pressable style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))} disabled={outOfStock}>
              <Minus size={16} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.qtyText}>{quantity}</Text>
            <Pressable style={styles.qtyBtn} onPress={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} disabled={outOfStock}>
              <Plus size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Pressable style={[styles.addBtn, (outOfStock || adding) && styles.btnDisabled]} onPress={handleAddToCart} disabled={outOfStock || adding}>
            <ShoppingCart size={18} color={colors.slate900} />
            <Text style={styles.addBtnText}>{adding ? "Adding..." : "Add to Cart"}</Text>
          </Pressable>
          <Pressable style={[styles.buyBtn, (outOfStock || adding) && styles.btnDisabled]} onPress={handleBuyNow} disabled={outOfStock || adding}>
            <Zap size={18} color={colors.white} />
            <Text style={styles.buyBtnText}>Buy Now</Text>
          </Pressable>
        </View>

        {/* Trust */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}><Truck size={18} color={colors.slate600} /><Text style={styles.trustText}>Free ship $100+</Text></View>
          <View style={styles.trustItem}><ShieldCheck size={18} color={colors.slate600} /><Text style={styles.trustText}>Secure</Text></View>
          <View style={styles.trustItem}><RotateCcw size={18} color={colors.slate600} /><Text style={styles.trustText}>30-day returns</Text></View>
        </View>

        {/* AI CTA */}
        <Pressable style={styles.aiCta} onPress={() => router.push("/tabs/ai")}>
          <Sparkles size={18} color={colors.slate700} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aiCtaTitle}>Not sure if this is right for you?</Text>
            <Text style={styles.aiCtaDesc}>Ask our AI assistant for help</Text>
          </View>
        </Pressable>
      </View>

      {/* Specs */}
      {specs.length > 0 && (
        <View style={styles.specsSection}>
          <Text style={styles.specsTitle}>Specifications</Text>
          {specs.map(([key, value], idx) => (
            <View key={key} style={[styles.specRow, idx % 2 === 0 && styles.specRowAlt]}>
              <Text style={styles.specKey}>{key}</Text>
              <Text style={styles.specValue}>{value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Reviews */}
      <View style={styles.reviewsSection}>
        <Text style={styles.reviewsTitle}>Reviews ({reviews.length})</Text>
        {reviews.length === 0 ? (
          <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>
                    {(review.profile?.full_name || "A")[0].toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.reviewName}>{review.profile?.full_name || "Anonymous"}</Text>
                  <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                </View>
                <StarRating rating={review.rating} size={12} />
              </View>
              {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
            </View>
          ))
        )}
      </View>

      {/* Related */}
      {related.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Related Products</Text>
          <View style={styles.relatedGrid}>
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </View>
        </View>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.text },
  imageContainer: { aspectRatio: 1, backgroundColor: colors.slate100, position: "relative" },
  mainImage: { width: "100%", height: "100%" },
  badges: { position: "absolute", top: 12, left: 12, gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  discountBadge: { backgroundColor: "#e11d48" },
  newBadge: { backgroundColor: "#16a34a" },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  thumbnails: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 8 },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.border },
  thumbActive: { borderColor: colors.slate900 },
  content: { padding: spacing.md, gap: 12 },
  category: { fontSize: 11, fontWeight: "600", color: colors.slate400, textTransform: "uppercase" },
  name: { fontSize: 22, fontWeight: "700", color: colors.text },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  price: { fontSize: 26, fontWeight: "700", color: colors.text },
  comparePrice: { fontSize: 16, color: colors.slate400, textDecorationLine: "line-through" },
  description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  stockRow: { flexDirection: "row", alignItems: "center" },
  stockOut: { fontSize: 14, fontWeight: "600", color: colors.error },
  stockLow: { fontSize: 14, fontWeight: "600", color: colors.warning },
  stockOkRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  stockOk: { fontSize: 14, fontWeight: "600", color: colors.success },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qtyLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
  qtyControl: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm },
  qtyBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 16, fontWeight: "600", color: colors.text, minWidth: 32, textAlign: "center" },
  actionRow: { flexDirection: "row", gap: 10 },
  addBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: colors.slate900, borderRadius: radius.md, paddingVertical: 14 },
  addBtnText: { fontSize: 14, fontWeight: "700", color: colors.slate900 },
  buyBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.slate900, borderRadius: radius.md, paddingVertical: 14 },
  buyBtnText: { fontSize: 14, fontWeight: "700", color: colors.white },
  btnDisabled: { opacity: 0.4 },
  trustRow: { flexDirection: "row", justifyContent: "space-around", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  trustItem: { alignItems: "center", gap: 4 },
  trustText: { fontSize: 11, color: colors.textSecondary, textAlign: "center" },
  aiCta: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.slate100, borderRadius: radius.md, padding: 12 },
  aiCtaTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  aiCtaDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  specsSection: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  specsTitle: { fontSize: 16, fontWeight: "700", color: colors.text, padding: spacing.md },
  specRow: { flexDirection: "row", paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  specRowAlt: { backgroundColor: colors.slate100 },
  specKey: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text },
  specValue: { flex: 1, fontSize: 14, color: colors.textSecondary },
  reviewsSection: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  reviewsTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 },
  noReviews: { fontSize: 14, color: colors.textSecondary, textAlign: "center", paddingVertical: 20 },
  reviewItem: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 8 },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.slate100, alignItems: "center", justifyContent: "center" },
  reviewAvatarText: { fontSize: 14, fontWeight: "600", color: colors.slate600 },
  reviewName: { fontSize: 13, fontWeight: "600", color: colors.text },
  reviewDate: { fontSize: 11, color: colors.slate400 },
  reviewComment: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  relatedSection: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  relatedTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 },
  relatedGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  notFoundTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  backBtn: { marginTop: 12, backgroundColor: colors.slate900, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md },
  backBtnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
});
