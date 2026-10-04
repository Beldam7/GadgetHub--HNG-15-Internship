import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Package, Mail, ArrowRight, Truck } from "lucide-react";
import { getOrderByNumber } from "@/services/orderService";
import type { Order } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";

export function OrderSuccess() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    async function load() {
      if (!orderNumber) return;
      try {
        const o = await getOrderByNumber(orderNumber);
        setOrder(o);
      } catch (err) {
        console.error("Order load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-100 mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Order not found</h1>
        <p className="text-slate-500 mt-2">We couldn't find this order. Please contact support if you believe this is an error.</p>
        <Link to="/" className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Order Confirmed!</h1>
        <p className="text-slate-500 mt-2">Thank you for your purchase. Your order has been placed successfully.</p>
      </div>

      {/* Order Info Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Order Number</p>
            <p className="text-lg font-bold text-slate-900">{order.order_number}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Order Date</p>
            <p className="text-sm font-semibold text-slate-900">{formatDate(order.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Customer</p>
            <p className="text-sm font-semibold text-slate-900">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Payment Method</p>
            <p className="text-sm font-semibold text-slate-900 capitalize">{order.payment_method.replace(/_/g, " ")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Order Status</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 capitalize">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {order.order_status}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
            <p className="text-sm font-bold text-slate-900">{formatPrice(order.total)}</p>
          </div>
        </div>
      </div>

      {/* Email Confirmation */}
      <div className={`rounded-xl border p-4 mb-6 flex items-start gap-3 ${
        order.email_status === "sent" ? "border-emerald-200 bg-emerald-50" :
        order.email_status === "failed" ? "border-amber-200 bg-amber-50" :
        "border-slate-200 bg-slate-50"
      }`}>
        <Mail className={`h-5 w-5 shrink-0 ${
          order.email_status === "sent" ? "text-emerald-600" :
          order.email_status === "failed" ? "text-amber-600" :
          "text-slate-600"
        }`} />
        <div>
          {order.email_status === "sent" && (
            <p className="text-sm font-medium text-slate-900">
              A confirmation email has been sent to {order.customer_email}.
            </p>
          )}
          {order.email_status === "failed" && (
            <p className="text-sm font-medium text-slate-900">
              We couldn't send a confirmation email right now, but your order is confirmed. You'll receive it shortly.
            </p>
          )}
          {order.email_status === "pending" && (
            <p className="text-sm font-medium text-slate-900">
              A confirmation email is being sent to {order.customer_email}.
            </p>
          )}
        </div>
      </div>

      {/* Order Items */}
      {order.order_items && order.order_items.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-900">{item.product_name}</p>
                  <p className="text-xs text-slate-500">Qty: {item.quantity} × {formatPrice(item.product_price)}</p>
                </div>
                <span className="font-semibold text-slate-900">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 mt-4 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold text-slate-900">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Shipping</span>
              <span className="font-semibold text-slate-900">{order.shipping_fee === 0 ? "Free" : formatPrice(order.shipping_fee)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-slate-900">Total</span>
              <span className="text-slate-900">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Address */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Truck className="h-5 w-5 text-slate-700" /> Shipping Address
        </h2>
        <div className="text-sm text-slate-600 leading-relaxed">
          <p className="font-medium text-slate-900">{order.customer_name}</p>
          <p>{order.shipping_address}</p>
          <p>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code || ""}</p>
          <p>{order.shipping_country}</p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Package className="h-4 w-4" /> What happens next?
        </h2>
        <ul className="text-sm text-slate-600 space-y-1.5">
          <li>1. We'll process and pack your order within 1-2 business days</li>
          <li>2. You'll receive a shipping notification with tracking details</li>
          <li>3. Your order will be delivered to the address above</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/account"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View Order History
        </Link>
        <Link
          to="/shop"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Continue Shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
