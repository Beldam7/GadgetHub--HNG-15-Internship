import { supabase } from "@/lib/supabase";
import type { ChatMessage, AIProductRecommendation } from "@/types";

export async function sendChatMessage(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<{ reply: string; products: AIProductRecommendation[] }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed (${response.status})`);
    }

    const data = await response.json();
    return {
      reply: data.reply || "I'm sorry, I couldn't process that.",
      products: data.products || [],
    };
  } catch (err) {
    console.error("AI chat error:", err);
    return {
      reply: "I'm having trouble connecting right now. Please try again in a moment.",
      products: [],
    };
  }
}

export type { ChatMessage };
