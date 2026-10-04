import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  category_id: string;
  description: string;
  specifications: Record<string, string>;
  stock_quantity: number;
  rating: number;
  review_count: number;
  image_url: string;
  is_on_sale: boolean;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { messages } = await req.json() as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch all active products with category info
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, category_id, description, specifications, stock_quantity, rating, review_count, image_url, is_on_sale")
      .eq("is_active", true)
      .order("rating", { ascending: false });

    if (prodError) throw prodError;

    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, name, slug");

    if (catError) throw catError;

    // Build a product catalog summary for the AI
    const categoryMap = new Map<string, string>();
    (categories as CategoryRow[]).forEach((c) => categoryMap.set(c.id, c.name));

    const catalogText = (products as ProductRow[])
      .filter((p) => p.stock_quantity > 0)
      .map((p) => {
        const cat = categoryMap.get(p.category_id) || "Unknown";
        const specs = Object.entries(p.specifications || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        return `- ${p.name} | Category: ${cat} | Price: $${p.price} | Stock: ${p.stock_quantity} | Rating: ${p.rating}/5 (${p.review_count} reviews) | Specs: ${specs} | Slug: ${p.slug}`;
      })
      .join("\n");

    const systemPrompt = `You are the GadgetHub AI shopping assistant. Help customers find the right gadget from our store inventory.

IMPORTANT RULES:
1. You can ONLY recommend products that exist in the catalog below. NEVER invent products or specifications.
2. Only recommend products that are in stock (stock > 0).
3. When a customer asks for a recommendation, ask clarifying questions FIRST (budget, use case, preferences) before recommending.
4. When you do recommend, format each recommendation as a JSON array in your response using this exact format:
   <PRODUCTS>
   [{"slug": "product-slug", "reason": "why it fits"}]
   </PRODUCTS>
   Place this JSON block at the END of your response, after your text explanation.
5. Structure recommendations as "Best Match" and "Alternative" when relevant.
6. If no products match the customer's needs, say so clearly and suggest the closest alternatives.
7. Be concise and helpful. Don't over-explain.
8. Consider budget, use case, specifications, battery life, weight, and ratings when comparing products.
9. Prices are in USD.

STORE CATALOG (only recommend from these):
${catalogText}`;

    const apiKey = Deno.env.get("AI_API_KEY") || Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      // Fallback: simple keyword-based recommendations without AI
      const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content.toLowerCase() || "";
      const reply = generateFallbackResponse(lastUserMsg, products as ProductRow[], categoryMap);
      return new Response(
        JSON.stringify({ reply, products: reply.products || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: Deno.env.get("AI_MODEL") || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      const fallback = generateFallbackResponse(
        messages.filter((m) => m.role === "user").pop()?.content.toLowerCase() || "",
        products as ProductRow[],
        categoryMap,
      );
      return new Response(
        JSON.stringify({ reply: fallback.text, products: fallback.products }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await aiResponse.json();
    const replyText = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";

    // Extract product recommendations from the <PRODUCTS> block
    const productsBlock = replyText.match(/<PRODUCTS>\s*([\s\S]*?)\s*<\/PRODUCTS>/);
    let recommendedProducts: Array<{ slug: string; reason: string }> = [];

    if (productsBlock) {
      try {
        recommendedProducts = JSON.parse(productsBlock[1]);
      } catch {
        recommendedProducts = [];
      }
    }

    // Fetch full product details for recommended products
    let productDetails: ProductRow[] = [];
    if (recommendedProducts.length > 0) {
      const slugs = recommendedProducts.map((p) => p.slug);
      const { data: recProds } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, category_id, description, specifications, stock_quantity, rating, review_count, image_url, is_on_sale")
        .in("slug", slugs)
        .eq("is_active", true);

      if (recProds) {
        const reasonMap = new Map(recommendedProducts.map((p) => [p.slug, p.reason]));
        productDetails = (recProds as ProductRow[]).map((p) => ({
          ...p,
          // Attach reason via a custom field - we'll handle on frontend
        }));
        // Return products with reasons
        const productsWithReasons = (recProds as ProductRow[]).map((p) => ({
          ...p,
          category_name: categoryMap.get(p.category_id) || "",
          reason: reasonMap.get(p.slug) || "",
        }));
        // Clean the reply text - remove the PRODUCTS block
        const cleanReply = replyText.replace(/<PRODUCTS>[\s\S]*?<\/PRODUCTS>/g, "").trim();
        return new Response(
          JSON.stringify({ reply: cleanReply, products: productsWithReasons }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const cleanReply = replyText.replace(/<PRODUCTS>[\s\S]*?<\/PRODUCTS>/g, "").trim();
    return new Response(
      JSON.stringify({ reply: cleanReply, products: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("AI assistant error:", err);
    return new Response(
      JSON.stringify({ error: "I'm having trouble right now. Please try again in a moment." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function generateFallbackResponse(
  query: string,
  products: ProductRow[],
  categoryMap: Map<string, string>,
): { text: string; products: Array<ProductRow & { reason: string; category_name: string }> } {
  // Simple keyword matching
  const keywords: Record<string, string[]> = {
    laptop: ["laptops", "laptop", "notebook", "computer", "programming", "coding", "dev"],
    phone: ["smartphones", "phone", "smartphone", "mobile", "iphone", "android"],
    tablet: ["tablets", "tablet", "ipad"],
    watch: ["smartwatches", "watch", "smartwatch", "fitness", "wearable"],
    earbuds: ["wireless-earbuds", "earbuds", "earphone", "airpod"],
    headphones: ["headphones", "headphone", "over-ear", "gaming headset"],
    speaker: ["bluetooth-speakers", "speaker", "bluetooth", "music"],
    gaming: ["gaming-accessories", "gaming", "keyboard", "mouse", "rgb", "esports"],
    charger: ["chargers-power-banks", "charger", "power bank", "charging", "usb"],
    "smart home": ["smart-home", "smart home", "home automation", "iot"],
    monitor: ["computer-accessories", "monitor", "display", "screen"],
    drone: ["drones-cameras", "drone", "camera", "aerial"],
  };

  let matchedCategory = "";
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some((w) => query.includes(w))) {
      matchedCategory = cat;
      break;
    }
  }

  if (!matchedCategory) {
    return {
      text: "Hi! I'm your GadgetHub shopping assistant. I can help you find the right gadget. What are you looking for? For example, you can say:\n\n• \"I need a laptop for programming under $1500\"\n• \"Looking for wireless earbuds with noise cancellation\"\n• \"Best smartwatch for fitness tracking\"\n\nWhat's your budget and what will you use it for?",
      products: [],
    };
  }

  const matching = products
    .filter((p) => {
      const catName = categoryMap.get(p.category_id) || "";
      return catName.toLowerCase().includes(matchedCategory) || matchedCategory.includes(catName.toLowerCase());
    })
    .filter((p) => p.stock_quantity > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  if (matching.length === 0) {
    return {
      text: `I couldn't find any ${matchedCategory} in stock right now. Please check back soon or browse our other categories!`,
      products: [],
    };
  }

  const productList = matching.map((p, i) => {
    const reason = i === 0 ? "Best match based on rating and value" : "Great alternative option";
    return `**${i === 0 ? "Best Match" : "Alternative"}**\n${p.name} — $${p.price}\n\nWhy:\n• ${reason}\n• Rating: ${p.rating}/5 (${p.review_count} reviews)\n• ${p.stock_quantity} in stock`;
  }).join("\n\n");

  return {
    text: `Here are my recommendations from our ${matchedCategory} collection:\n\n${productList}`,
    products: matching.map((p, i) => ({
      ...p,
      category_name: categoryMap.get(p.category_id) || "",
      reason: i === 0 ? "Best match based on rating and value" : "Great alternative option",
    })),
  };
}
