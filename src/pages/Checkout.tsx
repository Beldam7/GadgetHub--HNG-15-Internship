import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CreditCard, Truck, CheckCircle2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createOrder } from "@/services/orderService";
import { formatPrice } from "@/lib/utils";
import { STORE_CONFIG } from "@/config";

export function Checkout() {
  const { items, refreshCart } = useCart();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customer_name: profile?.full_name || user?.email || "",
    customer_email: user?.email || "",
    customer_phone: profile?.phone || "",
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_country: "",
    shipping_postal_code: "",
    payment_method: "pay_on_delivery",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const shippingFee = subtotal >= STORE_CONFIG.freeShippingThreshold ? 0 : STORE_CONFIG.shippingFee;
  const total = subtotal + shippingFee;

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.customer_name.trim()) e.customer_name = "Full name is required";
    if (!form.customer_email.trim()) e.customer_email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) e.customer_email = "Invalid email address";
    if (!form.shipping_address.trim()) e.shipping_address = "Address is required";
    if (!form.shipping_city.trim()) e.shipping_city = "City is required";
    if (!form.shipping_state.trim()) e.shipping_state = "State is required";
    if (!form.shipping_country.trim()) e.shipping_country = "Country is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setSubmitting(true);
    const result = await createOrder({
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      shipping_address: form.shipping_address,
      shipping_city: form.shipping_city,
      shipping_state: form.shipping_state,
      shipping_country: form.shipping_country,
      shipping_postal_code: form.shipping_postal_code,
      payment_method: form.payment_method,
    });

    setSubmitting(false);

    if (result.success && result.order) {
      await refreshCart();
      navigate(`/order-success/${result.order.order_number}`, { replace: true });
    } else {
      showToast(result.error || "Failed to place order. Please try again.", "error");
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Sign in to checkout</h1>
        <p className="text-slate-500 mt-2">You need an account to complete your purchase.</p>
        <Link to="/login" className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Sign In
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="text-slate-500 mt-2">Add some products before checking out.</p>
        <Link to="/shop" className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Cart
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white">1</span>
              Customer Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => updateField("customer_name", e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400 ${
                    errors.customer_name ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                {errors.customer_name && <p className="text-xs text-rose-600 mt-1">{errors.customer_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => updateField("customer_email", e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400 ${
                    errors.customer_email ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                {errors.customer_email && <p className="text-xs text-rose-600 mt-1">{errors.customer_email}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => updateField("customer_phone", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white">2</span>
              Shipping Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  value={form.shipping_address}
                  onChange={(e) => updateField("shipping_address", e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400 ${
                    errors.shipping_address ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                {errors.shipping_address && <p className="text-xs text-rose-600 mt-1">{errors.shipping_address}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  value={form.shipping_city}
                  onChange={(e) => updateField("shipping_city", e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400 ${
                    errors.shipping_city ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                {errors.shipping_city && <p className="text-xs text-rose-600 mt-1">{errors.shipping_city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State/Province *</label>
                <input
                  type="text"
                  value={form.shipping_state}
                  onChange={(e) => updateField("shipping_state", e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400 ${
                    errors.shipping_state ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                {errors.shipping_state && <p className="text-xs text-rose-600 mt-1">{errors.shipping_state}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
                <input
                  type="text"
                  value={form.shipping_country}
                  onChange={(e) => updateField("shipping_country", e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400 ${
                    errors.shipping_country ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                {errors.shipping_country && <p className="text-xs text-rose-600 mt-1">{errors.shipping_country}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={form.shipping_postal_code}
                  onChange={(e) => updateField("shipping_postal_code", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white">3</span>
              Payment Method
            </h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition ${
                form.payment_method === "pay_on_delivery" ? "border-slate-900 bg-slate-50" : "border-slate-200"
              }`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="pay_on_delivery"
                  checked={form.payment_method === "pay_on_delivery"}
                  onChange={(e) => updateField("payment_method", e.target.value)}
                  className="h-4 w-4 text-slate-900"
                />
                <Truck className="h-5 w-5 text-slate-700" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Pay on Delivery</p>
                  <p className="text-xs text-slate-500">Pay with cash or card when your order arrives</p>
                </div>
              </label>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 p-4 opacity-60">
                <CreditCard className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-600">Online Payment (Coming Soon)</p>
                  <p className="text-xs text-slate-400">Stripe, Paystack, or Flutterwave integration ready to be enabled</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 text-sm">
                  {item.product?.image_url && (
                    <img src={item.product.image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.product?.name}</p>
                    <p className="text-xs text-slate-500">Qty: {item.quantity} · {formatPrice(item.product?.price || 0)}</p>
                  </div>
                  <span className="font-semibold text-slate-900 shrink-0">
                    {formatPrice((item.product?.price || 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Shipping</span>
                <span className="font-semibold text-slate-900">{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-slate-900 text-lg">{formatPrice(total)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Placing Order...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Place Order</>
              )}
            </button>
            <p className="text-xs text-slate-400 mt-3 text-center">
              By placing your order, you agree to our terms and conditions.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
