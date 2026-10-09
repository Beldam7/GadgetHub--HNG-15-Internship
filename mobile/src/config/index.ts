export const STORE_CONFIG = {
  name: "GadgetHub",
  tagline: "Premium Gadgets, Delivered.",
  description: "Your one-stop shop for the latest tech gadgets and accessories.",
  supportEmail: "support@gadgethub.com",
  currency: "USD",
  currencySymbol: "$",
  freeShippingThreshold: 100,
  shippingFee: 15,
};

export const AI_GREETING = `Hi! I'm your ${STORE_CONFIG.name} shopping assistant. Tell me what you're looking for, your budget, and how you plan to use it, and I'll help you find the right gadget.`;

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
