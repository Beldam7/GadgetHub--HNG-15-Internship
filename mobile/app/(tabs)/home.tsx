import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, RefreshControl } from "react-native";
import { Cpu, Search, Sparkles, Truck, ShieldCheck, RotateCcw, Headphones, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { getFeaturedProducts, getNewArrivals, getOnSaleProducts, getCategories } from "@/services/productService";
import type { Product, Category } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton, LoadingSpinner } from "@/components/Skeletons";
import { STORE_CONFIG } from "@/config";
import { colors, spacing, radius } from "@/config/theme";
import { formatPrice } from "@/lib/utils";

export default function HomeScreen() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [onSale, setOnSale] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [f, n, s, c] = await Promise.all([
        getFeaturedProducts(8),
        getNewArrivals(4),
        getOnSaleProducts(4),
        getCategories(),
      ]);
      setFeatured(f);
      setNewArrivals(n);
      setOnSale(s);
      setCategories(c);
    } catch (err) {
      console.error("Home load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleSearch() {
    if (searchQuery.trim()) {
      router.push(`/tabs/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  }

  const trustItems = [
    { icon: Truck, title: "Free Shipping", desc: `Orders over $${STORE_CONFIG.freeShippingThreshold}` },
    { icon: ShieldCheck, title: "Secure", desc: "Protected checkout" },
    { icon: RotateCcw, title: "30-Day Returns", desc: "Hassle-free" },
    { icon: Headphones, title: "24/7 Support", desc: "Always here" },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color={colors.white} />
            <Text style={styles.heroBadgeText}>AI-Powered Shopping Assistant</Text>
          </View>
          <Text style={styles.heroTitle}>{STORE_CONFIG.tagline}</Text>
          <Text style={styles.heroDesc}>{STORE_CONFIG.description}</Text>
          <View style={styles.heroActions}>
            <Pressable style={styles.heroBtn} onPress={() => router.push("/tabs/shop")}>
              <Text style={styles.heroBtnText}>Shop Now</Text>
            </Pressable>
            <Pressable style={styles.heroBtnOutline} onPress={() => router.push("/tabs/ai")}>
              <Sparkles size={16} color={colors.white} />
              <Text style={styles.heroBtnOutlineText}>Ask AI</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Trust Bar */}
      <View style={styles.trustBar}>
        {trustItems.map((item) => (
          <View key={item.title} style={styles.trustItem}>
            <View style={styles.trustIcon}>
              <item.icon size={20} color={colors.slate900} />
            </View>
            <View>
              <Text style={styles.trustTitle}>{item.title}</Text>
              <Text style={styles.trustDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.slate400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search gadgets..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Categories */}
      <Section title="Categories" onSeeAll={() => router.push("/tabs/shop")}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {categories.slice(0, 8).map((cat) => (
            <Pressable
              key={cat.id}
              style={styles.categoryChip}
              onPress={() => router.push(`/tabs/shop?category=${cat.slug}`)}
            >
              {cat.image_url && <View style={styles.categoryImage} />}
              <Text style={styles.categoryText}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Section>

      {/* Featured */}
      <Section title="Featured Gadgets" onSeeAll={() => router.push("/tabs/shop")}>
        {featured.length === 0 ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <View style={styles.productGrid}>
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </View>
        )}
      </Section>

      {/* Special Offers */}
      {onSale.length > 0 && (
        <View style={styles.offersSection}>
          <Text style={styles.offersTitle}>Special Offers</Text>
          <Text style={styles.offersSubtitle}>Save big on selected gadgets</Text>
          <View style={styles.productGrid}>
            {onSale.map((p) => <ProductCard key={p.id} product={p} />)}
          </View>
        </View>
      )}

      {/* New Arrivals */}
      <Section title="New Arrivals" onSeeAll={() => router.push("/tabs/shop?sort=newest")}>
        {newArrivals.length === 0 ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <View style={styles.productGrid}>
            {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
          </View>
        )}
      </Section>

      {/* AI CTA */}
      <View style={styles.aiCta}>
        <View style={styles.aiCtaIcon}>
          <Sparkles size={24} color={colors.white} />
        </View>
        <View style={styles.aiCtaContent}>
          <Text style={styles.aiCtaTitle}>Not sure which gadget is right?</Text>
          <Text style={styles.aiCtaDesc}>Ask our AI assistant for personalized recommendations.</Text>
        </View>
        <Pressable style={styles.aiCtaBtn} onPress={() => router.push("/tabs/ai")}>
          <Text style={styles.aiCtaBtnText}>Try Now</Text>
        </Pressable>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function Section({ title, onSeeAll, children }: { title: string; onSeeAll: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable onPress={onSeeAll} style={styles.seeAll}>
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={16} color={colors.slate400} />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.slate900,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  heroContent: { gap: 12 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  heroBadgeText: { color: colors.white, fontSize: 12, fontWeight: "500" },
  heroTitle: { color: colors.white, fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  heroDesc: { color: "#94a3b8", fontSize: 15, lineHeight: 22 },
  heroActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  heroBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  heroBtnText: { color: colors.slate900, fontSize: 14, fontWeight: "700" },
  heroBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  heroBtnOutlineText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  trustBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "50%",
    paddingVertical: 6,
  },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.slate100,
    alignItems: "center",
    justifyContent: "center",
  },
  trustTitle: { fontSize: 13, fontWeight: "600", color: colors.text },
  trustDesc: { fontSize: 11, color: colors.textSecondary },
  searchContainer: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  seeAll: { flexDirection: "row", alignItems: "center" },
  seeAllText: { fontSize: 13, color: colors.slate400, fontWeight: "500" },
  hScroll: { gap: 10, paddingRight: spacing.md },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  categoryImage: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.slate400,
  },
  categoryText: { fontSize: 13, fontWeight: "600", color: colors.text },
  productGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  offersSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.slate900,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  offersTitle: { fontSize: 18, fontWeight: "700", color: colors.white },
  offersSubtitle: { fontSize: 13, color: "#94a3b8", marginTop: 2, marginBottom: 12 },
  aiCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.slate100,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  aiCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.slate900,
    alignItems: "center",
    justifyContent: "center",
  },
  aiCtaContent: { flex: 1 },
  aiCtaTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  aiCtaDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  aiCtaBtn: {
    backgroundColor: colors.slate900,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  aiCtaBtnText: { color: colors.white, fontSize: 13, fontWeight: "600" },
});
