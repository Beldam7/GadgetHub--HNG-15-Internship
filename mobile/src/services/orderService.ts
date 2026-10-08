import { supabase } from "@/lib/supabase";
import type { Order, OrderItem } from "@/types";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config";

export async function getUserOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`*, order_items:order_items(*)`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Order[]) || [];
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(`*, order_items:order_items(*)`)
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw error;
  return data as Order | null;
}

interface CreateOrderInput {
  items: Array<{ product_id: string; quantity: number }>;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_postal_code: string;
  payment_method: string;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<{ success: boolean; order?: Order & { order_items?: OrderItem[] }; error?: string }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;

    if (!accessToken) {
      return { success: false, error: "You must be signed in to place an order." };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify(input),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || "Failed to create order." };
    }

    return { success: true, order: result.order };
  } catch (err) {
    console.error("Create order error:", err);
    return { success: false, error: "Network error. Please check your connection and try again." };
  }
}
