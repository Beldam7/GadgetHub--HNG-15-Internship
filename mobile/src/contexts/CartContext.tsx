import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { CartItem, Product } from "@/types";

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  loading: boolean;
  cartId: string | null;
  addToCart: (product: Product, quantity?: number) => Promise<{ error: string | null }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data: existingCart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      let cId = existingCart?.id;

      if (!cId) {
        const { data: newCart, error } = await supabase
          .from("carts")
          .insert({ user_id: userId })
          .select("id")
          .single();
        if (error) {
          setLoading(false);
          return;
        }
        cId = newCart.id;
      }

      setCartId(cId);

      const { data: cartItems, error } = await supabase
        .from("cart_items")
        .select(`*, product:products(*)`)
        .eq("cart_id", cId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Cart items load error:", error);
      }

      setItems((cartItems as CartItem[]) || []);
    } catch (err) {
      console.error("Load cart error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load cart on auth change + set up Supabase Realtime for cross-platform sync
  useEffect(() => {
    if (user) {
      loadCart(user.id);
    } else {
      setItems([]);
      setCartId(null);
      setLoading(false);
    }
  }, [user, loadCart]);

  // Realtime subscription for cart sync between website and mobile
  useEffect(() => {
    if (!cartId) return;

    const channel = supabase
      .channel(`cart-${cartId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items", filter: `cart_id=eq.${cartId}` },
        () => {
          if (user) loadCart(user.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cartId, user, loadCart]);

  const addToCart = useCallback(
    async (product: Product, quantity = 1): Promise<{ error: string | null }> => {
      if (!user || !cartId) {
        return { error: "Please sign in to add items to your cart." };
      }

      const existing = items.find((item) => item.product_id === product.id);
      const newQty = (existing?.quantity || 0) + quantity;

      if (newQty > product.stock_quantity) {
        return { error: `Only ${product.stock_quantity} units available.` };
      }

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: newQty })
          .eq("id", existing.id);
        if (error) return { error: "Failed to update cart. Please try again." };
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ cart_id: cartId, product_id: product.id, quantity });
        if (error) return { error: "Failed to add item to cart. Please try again." };
      }

      await loadCart(user.id);
      return { error: null };
    },
    [user, cartId, items, loadCart],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) return;
      const item = items.find((i) => i.id === itemId);
      if (item?.product && quantity > item.product.stock_quantity) return;

      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);
      if (error) return;

      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
    },
    [items],
  );

  const removeItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
    if (error) return;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const clearCart = useCallback(async () => {
    if (!cartId) return;
    const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
    if (error) console.error("Clear cart error:", error);
    setItems([]);
  }, [cartId]);

  const refreshCart = useCallback(async () => {
    if (user) await loadCart(user.id);
  }, [user, loadCart]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, cartCount, loading, cartId, addToCart, updateQuantity, removeItem, clearCart, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
