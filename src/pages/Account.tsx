import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Package, LogOut, Mail, Phone, MapPin, ChevronRight, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { getUserOrders } from "@/services/orderService";
import { updateProfile } from "@/services/profileService";
import type { Order } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";

type Tab = "profile" | "orders" | "settings";

export function Account() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    setEditForm({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
    });
    async function loadOrders() {
      try {
        const o = await getUserOrders();
        setOrders(o);
      } catch (err) {
        console.error("Orders load error:", err);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadOrders();
  }, [user, profile, navigate]);

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, editForm);
    setSaving(false);
    if (error) {
      showToast("Failed to update profile", "error");
    } else {
      showToast("Profile updated!", "success");
      setEditing(false);
      await refreshProfile();
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white">
          {(profile?.full_name || user.email || "U")[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{profile?.full_name || "My Account"}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        <button
          onClick={() => setTab("orders")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            tab === "orders" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Package className="h-4 w-4" /> Orders ({orders.length})
        </button>
        <button
          onClick={() => setTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            tab === "profile" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <User className="h-4 w-4" /> Profile
        </button>
        <button
          onClick={() => setTab("settings")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            tab === "settings" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Settings className="h-4 w-4" /> Settings
        </button>
      </div>

      {/* Orders Tab */}
      {tab === "orders" && (
        <div>
          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
              <Package className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900">No orders yet</h3>
              <p className="text-sm text-slate-500 mt-1">When you place an order, it will appear here.</p>
              <Link to="/shop" className="mt-4 inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/order-success/${order.order_number}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{order.order_number}</p>
                      <p className="text-sm text-slate-500">{formatDate(order.created_at)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          order.order_status === "confirmed" || order.order_status === "delivered"
                            ? "bg-emerald-100 text-emerald-700"
                            : order.order_status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {order.order_status}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500 capitalize">{order.payment_method.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900">{formatPrice(order.total)}</p>
                      <p className="text-xs text-slate-500">{order.order_items?.length || 0} item(s)</p>
                      <ChevronRight className="h-4 w-4 text-slate-400 ml-auto mt-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="max-w-lg">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Profile Information</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Email</p>
                  {editing ? (
                    <p className="text-sm font-medium text-slate-900">{user.email}</p>
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{user.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-slate-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Full Name</p>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-slate-400"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{profile?.full_name || "Not set"}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Phone</p>
                  {editing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-slate-400"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{profile?.phone || "Not set"}</p>
                  )}
                </div>
              </div>
            </div>
            {editing && (
              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditForm({ full_name: profile?.full_name || "", phone: profile?.phone || "" }); }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="max-w-lg space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Account Settings</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                  <p className="text-xs text-slate-500">Receive order confirmations and updates</p>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Enabled</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Account Type</p>
                  <p className="text-xs text-slate-500">Google Authentication</p>
                </div>
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">Google</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
            <h2 className="text-lg font-bold text-rose-900 mb-2">Sign Out</h2>
            <p className="text-sm text-rose-700 mb-3">You'll be signed out of your account on this device.</p>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
