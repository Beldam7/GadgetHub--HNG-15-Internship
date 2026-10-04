import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Truck, ShieldCheck, RotateCcw, Headphones, ArrowRight } from "lucide-react";
import { getFeaturedProducts, getNewArrivals, getOnSaleProducts, getCategories } from "@/services/productService";
import type { Product, Category } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeletons";
import { STORE_CONFIG } from "@/config";

export function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [onSale, setOnSale] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
      }
    }
    load();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)"
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Shopping Assistant
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {STORE_CONFIG.tagline}
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl">
              Discover the latest smartphones, laptops, smartwatches, and more. Let our AI assistant help you find the perfect gadget for your needs and budget.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/categories"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 py-6 lg:grid-cols-4">
            {[
              { icon: Truck, title: "Free Shipping", desc: `On orders over $${STORE_CONFIG.freeShippingThreshold}` },
              { icon: ShieldCheck, title: "Secure Checkout", desc: "Your data is protected" },
              { icon: RotateCcw, title: "30-Day Returns", desc: "Hassle-free return policy" },
              { icon: Headphones, title: "24/7 Support", desc: "Always here to help" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                  <item.icon className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Shop by Category</h2>
          <Link to="/categories" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-xl border border-slate-200 aspect-square"
            >
              {cat.image_url && (
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-sm font-semibold text-white">{cat.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Featured Gadgets</h2>
          <Link to="/shop" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            View all →
          </Link>
        </div>
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Special Offers */}
      {onSale.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Special Offers</h2>
                <p className="text-sm text-slate-400 mt-1">Save big on selected gadgets</p>
              </div>
              <Link to="/shop?sale=true" className="text-sm font-medium text-white hover:text-slate-300">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {onSale.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">New Arrivals</h2>
          <Link to="/shop?sort=newest" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            View all →
          </Link>
        </div>
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* AI CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 sm:p-12">
          <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute right-10 top-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white mb-4">
              <Sparkles className="h-4 w-4" /> AI Shopping Assistant
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Not sure which gadget is right for you?</h2>
            <p className="text-slate-300 mb-6">
              Our AI assistant will ask about your budget, use case, and preferences to recommend the perfect products from our inventory. No more guessing — get personalized recommendations in seconds.
            </p>
            <p className="text-sm text-slate-400">
              Click the chat icon in the bottom right corner to start a conversation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
