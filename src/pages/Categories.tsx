import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCategories } from "@/services/productService";
import type { Category } from "@/types";

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">All Categories</h1>
      <p className="text-sm text-slate-500 mb-6">Browse gadgets by category</p>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-lg"
            >
              <div className="aspect-[16/9] overflow-hidden bg-slate-50">
                {cat.image_url && (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-700">{cat.name}</h3>
                {cat.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                )}
                <div className="mt-3 flex items-center gap-1 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Browse products <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
