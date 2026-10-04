import { supabase } from "@/lib/supabase";
import type { Product, Category } from "@/types";

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as Category[];
}

export async function getProducts(filters?: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  minRating?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "popular" | "rating";
  limit?: number;
  offset?: number;
}): Promise<{ products: Product[]; total: number }> {
  let query = supabase
    .from("products")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("is_active", true);

  if (filters?.category) {
    query = query.eq("category.slug", filters.category);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte("price", filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte("price", filters.maxPrice);
  }

  if (filters?.inStockOnly) {
    query = query.gt("stock_quantity", 0);
  }

  if (filters?.minRating !== undefined) {
    query = query.gte("rating", filters.minRating);
  }

  switch (filters?.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "popular":
      query = query.order("review_count", { ascending: false });
      break;
    case "rating":
      query = query.order("rating", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1);
    }
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { products: (data as Product[]) || [], total: count || 0 };
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("rating", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Product[]) || [];
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .eq("is_new_arrival", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Product[]) || [];
}

export async function getOnSaleProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .eq("is_on_sale", true)
    .order("rating", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Product[]) || [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function getRelatedProducts(
  categoryId: string,
  excludeId: string,
  limit = 4,
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .order("rating", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Product[]) || [];
}

export async function searchProducts(query: string, limit = 20): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order("rating", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Product[]) || [];
}
