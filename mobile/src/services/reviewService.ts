import { supabase } from "@/lib/supabase";
import type { Review } from "@/types";

export async function getProductReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(`*, profile:profiles(full_name, avatar_url)`)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Review[]) || [];
}

export async function addReview(
  productId: string,
  rating: number,
  comment: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("reviews")
    .insert({ product_id: productId, rating, comment });
  if (error) return { error: error.message };
  return { error: null };
}
