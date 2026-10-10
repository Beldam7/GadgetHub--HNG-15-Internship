import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
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
  // Lets us ignore results from an older, slower load
  const loadCounter = useRef(0);

  const loadCart = useCallback(async (userId: string) => {
    const myLoad = ++loadCounter.current;
    setLoading(true);
    try {
      // Find the user's oldest cart (safe even if duplicates exist)
      const findCart = async (): Promise<string | undefined> => {
        const { data } = await supabase
          .from("carts")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
          .limit(1);
        return data?.[0]?.id as string | undefined;
      };

      let cId = await findCart();

      if (!cId) {
        const { data: newCart, error } = await supabase
          .from("carts")
          .insert({ user_id: userId })
          .select("id")
          .single();
        if (error) {
          // Another request may have created it a moment ago
          cId = await findCart();
          if (!cId) {
            console.error("Cart creation error:", error);
            return;
          }
        } else {
          cId = newCart.id;
        }
      }

      if (myLoad !== loadCounter.current) return;
      setCartId(cId);

      // Load cart items with product details
      const { data: cartItems, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          product:products(*)
        `)
        .eq("cart_id", cId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Cart items load error:", error);
      }

      if (myLoad !== loadCounter.current) return;
      setItems((cartItems as CartItem[]) || []);
    } catch (err) {
      console.error("Load cart error:", err);
    } finally {
      if (myLoad === loadCounter.current) setLoading(false);
    }
  }, []);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (userId) {
      loadCart(userId);
    } else {
      loadCounter.current++;
      setItems([]);
      setCartId(null);
      setLoading(false);
    }
  }, [userId, loadCart]);

  const addToCart = useCallback(
    async (product: Product, quantity = 1): Promise<{ error: string | null }> => {
      if (!user || !cartId) {
        return { error: "Please sign in to add items to your cart." };
      }

      // Check if item already exists
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
      if (error) {
        console.error("Update quantity error:", error);
        return;
      }

      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
      );
    },
    [items],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) {
        console.error("Remove item error:", error);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    },
    [],
  );

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
      value={{
        items,
        cartCount,
        loading,
        cartId,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
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