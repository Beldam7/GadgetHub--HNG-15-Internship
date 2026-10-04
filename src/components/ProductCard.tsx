import { Link } from "react-router-dom";
import { ShoppingCart, Eye } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice, getDiscountPercentage } from "@/lib/utils";
import { StarRating } from "@/components/StarRating";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { useState } from "react";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);

  const discount = getDiscountPercentage(product.price, product.compare_at_price);
  const outOfStock = product.stock_quantity === 0;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:border-slate-300 hover:shadow-lg">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white">
                -{discount}%
              </span>
            )}
            {product.is_new_arrival && (
              <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
                New
              </span>
            )}
            {outOfStock && (
              <span className="rounded-full bg-slate-600 px-2.5 py-1 text-xs font-semibold text-white">
                Out of Stock
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <span className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            {product.category.name}
          </span>
        )}
        <Link to={`/product/${product.slug}`}>
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-slate-900 hover:text-slate-700">
            {product.name}
          </h3>
        </Link>
        <div className="mb-2">
          <StarRating rating={product.rating} size={14} showNumber reviewCount={product.review_count} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">{formatPrice(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock || adding}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={14} />
            {adding ? "Adding..." : "Add to Cart"}
          </button>
          <Link
            to={`/product/${product.slug}`}
            className="flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Eye size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
