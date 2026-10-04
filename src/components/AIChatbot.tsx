import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send, ShoppingBag, Sparkles } from "lucide-react";
import { sendChatMessage } from "@/services/aiService";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { STORE_CONFIG, AI_GREETING } from "@/config";
import { formatPrice } from "@/lib/utils";
import type { ChatMessage, AIProductRecommendation } from "@/types";

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: AI_GREETING, timestamp: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const chatHistory = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
    const { reply, products } = await sendChatMessage(chatHistory);

    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: reply,
      products: products.length > 0 ? products : undefined,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleAddToCart(product: AIProductRecommendation) {
    const { error } = await addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compare_at_price: product.compare_at_price,
      currency: "USD",
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
    } as any, 1);
    if (error) {
      showToast(error, "error");
    } else {
      showToast("Added to cart!", "success");
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all hover:scale-105 hover:bg-slate-800"
          aria-label="Open AI Shopping Assistant"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs">
            <Sparkles className="h-3 w-3" />
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed inset-0 z-50 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] sm:max-h-[80vh] flex flex-col rounded-none sm:rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Shopping Assistant</p>
                <p className="text-xs text-slate-400">{STORE_CONFIG.name}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.role === "user" ? "" : "w-full"}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-slate-900 text-white rounded-br-sm"
                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Product Recommendations */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.products.map((product) => (
                        <div
                          key={product.id}
                          className="rounded-xl border border-slate-200 bg-white p-3 flex gap-3"
                        >
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-16 w-16 rounded-lg object-cover shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{product.name}</p>
                            <p className="text-sm font-bold text-slate-900">{formatPrice(product.price)}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{product.reason}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {product.stock_quantity > 0
                                ? `${product.stock_quantity} in stock`
                                : "Out of stock"}
                              {" · "}{product.rating}★ ({product.review_count})
                            </p>
                            <div className="flex gap-1.5 mt-2">
                              <Link
                                to={`/product/${product.slug}`}
                                onClick={() => setOpen(false)}
                                className="flex-1 rounded-lg bg-slate-100 px-2 py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-200"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => handleAddToCart(product)}
                                disabled={product.stock_quantity === 0}
                                className="flex-1 rounded-lg bg-slate-900 px-2 py-1.5 text-center text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                <ShoppingBag size={12} /> Add
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-slate-200 p-3 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about gadgets..."
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="rounded-lg bg-slate-900 px-3 py-2 text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
