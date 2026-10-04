import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/utils";
import { STORE_CONFIG } from "@/config";

export function Cart() {
  const { items, updateQuantity, removeItem, loading } = useCart();
  const { user } = useAuth();

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);
  const shippingFee = subtotal >= STORE_CONFIG.freeShippingThreshold ? 0 : subtotal > 0 ? STORE_CONFIG.shippingFee : 0;
  const total = subtotal + shippingFee;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-32 animate-pulse rounded bg-slate-100 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Sign in to view your cart</h1>
        <p className="text-slate-500 mt-2">You need an account to use the shopping cart.</p>
        <Link to="/login" className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Sign In
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="text-slate-500 mt-2">Browse our gadgets and add something you like.</p>
        <Link to="/shop" className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              {item.product?.image_url && (
                <Link to={`/product/${item.product.slug}`} className="shrink-0">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                </Link>
              )}
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.product?.slug}`}>
                  <h3 className="font-semibold text-slate-900 hover:text-slate-700 truncate">{item.product?.name}</h3>
                </Link>
                <p className="text-sm text-slate-500 mt-0.5">{formatPrice(item.product?.price || 0)}</p>
                {item.product && item.product.stock_quantity < item.quantity && (
                  <p className="text-xs text-rose-600 mt-1">Only {item.product.stock_quantity} in stock</p>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-l-lg"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 py-1.5 text-sm font-semibold text-slate-900 min-w-[2.5rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => item.product && updateQuantity(item.id, Math.min(item.product.stock_quantity, item.quantity + 1))}
                      className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-r-lg"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-slate-900">
                  {formatPrice((item.product?.price || 0) * item.quantity)}
                </p>
              </div>
            </div>
          ))}

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mt-2"
          >
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal ({items.length} items)</span>
                <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Shipping</span>
                <span className="font-semibold text-slate-900">
                  {shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
                </span>
              </div>
              {shippingFee > 0 && (
                <p className="text-xs text-slate-400">
                  Add {formatPrice(STORE_CONFIG.freeShippingThreshold - subtotal)} more for free shipping
                </p>
              )}
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-slate-900 text-lg">{formatPrice(total)}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
