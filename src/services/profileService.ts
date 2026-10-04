import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "full_name" | "phone" | "avatar_url">>,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  return { error: null };
}
