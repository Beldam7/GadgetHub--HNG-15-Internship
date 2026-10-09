import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, FlatList, RefreshControl } from "react-native";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getProducts, getCategories } from "@/services/productService";
import type { Product, Category } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton, LoadingSpinner } from "@/components/Skeletons";
import { colors, spacing, radius } from "@/config/theme";

type SortOption = "newest" | "popular" | "price_asc" | "price_desc" | "rating";

export default function ShopScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string; category?: string; sort?: string; sale?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  const [searchQuery, setSearchQuery] = useState(params.search || "");
  const [selectedCategory, setSelectedCategory] = useState(params.category || "");
  const [sort, setSort] = useState<SortOption>((params.sort as SortOption) || "newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [saleOnly, setSaleOnly] = useState(params.sale === "true");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { products: prods, total: count } = await getProducts({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        sort,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        inStockOnly: inStockOnly || saleOnly,
        limit: pageSize,
        offset: page * pageSize,
      });
      setProducts(prods);
      setTotal(count);
    } catch (err) {
      console.error("Shop load error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, sort, minPrice, maxPrice, inStockOnly, saleOnly, page]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { setPage(0); }, [searchQuery, selectedCategory, sort, minPrice, maxPrice, inStockOnly, saleOnly]);

  function clearFilters() {
    setSearchQuery(""); setSelectedCategory(""); setMinPrice(""); setMaxPrice("");
    setInStockOnly(false); setSaleOnly(false); setSort("newest");
  }

  const hasFilters = !!(searchQuery || selectedCategory || minPrice || maxPrice || inStockOnly || saleOnly);
  const totalPages = Math.ceil(total / pageSize);

  const sortLabels: Record<SortOption, string> = {
    newest: "Newest", popular: "Most Popular", rating: "Highest Rated",
    price_asc: "Price: Low → High", price_desc: "Price: High → Low",
  };

  if (loading && page === 0) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
        <Text style={styles.headerSub}>
          {searchQuery ? `Results for "${searchQuery}"` : "Browse our gadgets"}
          {total > 0 && ` · ${total} items`}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.slate400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search gadgets..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
        <Pressable style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={18} color={colors.slate900} />
        </Pressable>
      </View>

      {/* Sort Bar */}
      <View style={styles.sortRow}>
        <Pressable style={styles.sortBtn} onPress={() => setShowSortMenu(!showSortMenu)}>
          <Text style={styles.sortLabel}>Sort: {sortLabels[sort]}</Text>
          <ChevronDown size={16} color={colors.slate400} />
        </Pressable>
        {hasFilters && (
          <Pressable onPress={clearFilters} style={styles.clearBtn}>
            <X size={14} color={colors.error} />
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {/* Sort Dropdown */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {(Object.keys(sortLabels) as SortOption[]).map((s) => (
            <Pressable
              key={s}
              style={[styles.sortMenuItem, sort === s && styles.sortMenuItemActive]}
              onPress={() => { setSort(s); setShowSortMenu(false); }}
            >
              <Text style={[styles.sortMenuItemText, sort === s && styles.sortMenuItemTextActive]}>
                {sortLabels[s]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <ScrollView style={styles.filtersPanel} nestedScrollEnabled>
          <Text style={styles.filterSectionTitle}>Categories</Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, !selectedCategory && styles.chipActive]}
              onPress={() => setSelectedCategory("")}
            >
              <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
            </Pressable>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.chip, selectedCategory === cat.slug && styles.chipActive]}
                onPress={() => setSelectedCategory(cat.slug)}
              >
                <Text style={[styles.chipText, selectedCategory === cat.slug && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Price Range</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              placeholder="Min $"
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.priceInput}
              placeholder="Max $"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.filterSectionTitle}>Availability</Text>
          <Pressable style={styles.checkRow} onPress={() => setInStockOnly(!inStockOnly)}>
            <View style={[styles.checkbox, inStockOnly && styles.checkboxActive]}>
              {inStockOnly && <View style={styles.checkboxFill} />}
            </View>
            <Text style={styles.checkLabel}>In Stock Only</Text>
          </Pressable>
          <Pressable style={styles.checkRow} onPress={() => setSaleOnly(!saleOnly)}>
            <View style={[styles.checkbox, saleOnly && styles.checkboxActive]}>
              {saleOnly && <View style={styles.checkboxFill} />}
            </View>
            <Text style={styles.checkLabel}>On Sale</Text>
          </Pressable>

          <Pressable style={styles.applyBtn} onPress={() => setShowFilters(false)}>
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Products */}
      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <Search size={48} color={colors.slate200} />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptyDesc}>Try adjusting your filters</Text>
          {hasFilters && (
            <Pressable style={styles.emptyBtn} onPress={clearFilters}>
              <Text style={styles.emptyBtnText}>Clear Filters</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProducts(); }} />}
        >
          <View style={styles.productGrid}>
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </View>
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <Pressable
                style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                onPress={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                <Text style={styles.pageBtnText}>Previous</Text>
              </Pressable>
              <Text style={styles.pageInfo}>Page {page + 1} / {totalPages}</Text>
              <Pressable
                style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
                onPress={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                <Text style={styles.pageBtnText}>Next</Text>
              </Pressable>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  headerTitle: { fontSize: 24, fontWeight: "700", color: colors.text },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  searchRow: { flexDirection: "row", gap: 8, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  searchBar: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  filterBtn: {
    width: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, alignItems: "center", justifyContent: "center",
  },
  sortRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  clearText: { fontSize: 13, fontWeight: "500", color: colors.error },
  sortMenu: {
    marginHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: spacing.sm,
  },
  sortMenuItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  sortMenuItemActive: { backgroundColor: colors.slate100 },
  sortMenuItemText: { fontSize: 14, color: colors.textSecondary },
  sortMenuItemTextActive: { fontWeight: "600", color: colors.text },
  filtersPanel: {
    marginHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm,
  },
  filterSectionTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 12, marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.slate900, borderColor: colors.slate900 },
  chipText: { fontSize: 13, fontWeight: "500", color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  priceRow: { flexDirection: "row", gap: 8 },
  priceInput: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.slate200, alignItems: "center", justifyContent: "center" },
  checkboxActive: { borderColor: colors.slate900 },
  checkboxFill: { width: 10, height: 10, backgroundColor: colors.slate900, borderRadius: 2 },
  checkLabel: { fontSize: 14, color: colors.textSecondary },
  applyBtn: { backgroundColor: colors.slate900, borderRadius: radius.md, paddingVertical: 12, alignItems: "center", marginTop: 16 },
  applyBtnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  productGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: spacing.xs },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 12 },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  emptyBtn: { marginTop: 16, backgroundColor: colors.slate900, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.md },
  emptyBtnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 16 },
  pageBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 8 },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, fontWeight: "500", color: colors.textSecondary },
  pageInfo: { fontSize: 13, color: colors.textSecondary },
});
