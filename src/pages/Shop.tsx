import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { getProducts, getCategories } from "@/services/productService";
import type { Product, Category } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeletons";

type SortOption = "newest" | "popular" | "price_asc" | "price_desc" | "rating";

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = (searchParams.get("sort") as SortOption) || "newest";
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const inStockOnly = searchParams.get("inStock") === "true";
  const saleOnly = searchParams.get("sale") === "true";
  const minRating = searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined;

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { products: prods, total: count } = await getProducts({
        search: search || undefined,
        category: category || undefined,
        sort,
        minPrice,
        maxPrice,
        inStockOnly: inStockOnly || saleOnly,
        minRating,
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
    }
  }, [search, category, sort, minPrice, maxPrice, inStockOnly, saleOnly, minRating, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setPage(0);
  }, [search, category, sort, minPrice, maxPrice, inStockOnly, saleOnly, minRating]);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params);
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams());
  }

  const hasFilters = !!(search || category || minPrice || maxPrice || inStockOnly || saleOnly || minRating);
  const totalPages = Math.ceil(total / pageSize);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Categories</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => updateParam("category", null)}
            className={`block w-full text-left px-2 py-1.5 rounded-md text-sm transition ${
              !category ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam("category", cat.slug)}
              className={`block w-full text-left px-2 py-1.5 rounded-md text-sm transition ${
                category === cat.slug ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Price Range</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={searchParams.get("minPrice") || ""}
              onChange={(e) => updateParam("minPrice", e.target.value || null)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-slate-400"
            />
            <input
              type="number"
              placeholder="Max"
              value={searchParams.get("maxPrice") || ""}
              onChange={(e) => updateParam("maxPrice", e.target.value || null)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Availability</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => updateParam("inStock", e.target.checked ? "true" : null)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
          />
          <span className="text-sm text-slate-600">In Stock Only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer mt-2">
          <input
            type="checkbox"
            checked={saleOnly}
            onChange={(e) => updateParam("sale", e.target.checked ? "true" : null)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
          />
          <span className="text-sm text-slate-600">On Sale</span>
        </label>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Minimum Rating</h3>
        <div className="space-y-1.5">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => updateParam("minRating", r === 0 ? null : String(r))}
              className={`block w-full text-left px-2 py-1.5 rounded-md text-sm transition ${
                (minRating === r || (r === 0 && !minRating)) ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {r === 0 ? "All Ratings" : `${r}★ & up`}
            </button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Shop</h1>
        <p className="text-sm text-slate-500 mt-1">
          {search ? `Results for "${search}"` : "Browse our collection of premium gadgets"}
          {total > 0 && ` · ${total} product${total !== 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-20 bg-white rounded-xl border border-slate-200 p-4">
            <FilterContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 lg:hidden"
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-slate-500 hidden sm:inline">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => updateParam("sort", e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-20 text-center">
              <Search className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900">No products found</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setShowFilters(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterContent />
          </div>
        </div>
      )}
    </div>
  );
}
