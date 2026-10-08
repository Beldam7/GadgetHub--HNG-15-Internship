import { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Image } from "react-native";
import { Send, Sparkles, ShoppingBag, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { sendChatMessage } from "@/services/aiService";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { AI_GREETING, STORE_CONFIG } from "@/config";
import { formatPrice } from "@/lib/utils";
import { colors, spacing, radius } from "@/config/theme";
import type { ChatMessage, AIProductRecommendation } from "@/types";

export default function AIScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: AI_GREETING, timestamp: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const chatHistory = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
    const { reply, products } = await sendChatMessage(chatHistory);

    setMessages((prev) => [...prev, {
      role: "assistant", content: reply,
      products: products.length > 0 ? products : undefined,
      timestamp: Date.now(),
    }]);
    setLoading(false);
  }, [input, loading, messages]);

  async function handleAddToCart(product: AIProductRecommendation) {
    const { error } = await addToCart({
      id: product.id, name: product.name, slug: product.slug,
      price: product.price, compare_at_price: product.compare_at_price,
      currency: "USD", stock_quantity: product.stock_quantity,
      image_url: product.image_url, images: [], specifications: {},
      category_id: "", description: null, sku: null, rating: product.rating,
      review_count: product.review_count, is_active: true,
      is_featured: false, is_new_arrival: false, is_on_sale: product.is_on_sale,
      created_at: "", updated_at: "",
    } as any, 1);
    if (error) showToast(error, "error");
    else showToast("Added to cart!", "success");
  }

  function renderMessage(msg: ChatMessage) {
    const isUser = msg.role === "user";
    return (
      <View style={[styles.msgContainer, isUser ? styles.userMsgContainer : styles.aiMsgContainer]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Sparkles size={14} color={colors.white} />
          </View>
        )}
        <View style={{ flex: 1, maxWidth: "85%" }}>
          <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.msgText, isUser ? styles.userMsgText : styles.aiMsgText]}>{msg.content}</Text>
          </View>

          {msg.products && msg.products.length > 0 && (
            <View style={styles.productsList}>
              {msg.products.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productRow}>
                    {product.image_url && (
                      <Image source={{ uri: product.image_url }} style={styles.productImage} />
                    )}
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                      <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                      <Text style={styles.productReason} numberOfLines={2}>{product.reason}</Text>
                      <Text style={styles.productMeta}>
                        {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                        {" · "}{product.rating}★ ({product.review_count})
                      </Text>
                    </View>
                  </View>
                  <View style={styles.productActions}>
                    <Pressable
                      style={styles.viewBtn}
                      onPress={() => router.push(`/product/${product.slug}`)}
                    >
                      <Text style={styles.viewBtnText}>View</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.cartBtn, product.stock_quantity === 0 && styles.cartBtnDisabled]}
                      onPress={() => handleAddToCart(product)}
                      disabled={product.stock_quantity === 0}
                    >
                      <ShoppingBag size={12} color={colors.white} />
                      <Text style={styles.cartBtnText}>Add to Cart</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Sparkles size={20} color={colors.white} />
        </View>
        <View>
          <Text style={styles.headerTitle}>AI Shopping Assistant</Text>
          <Text style={styles.headerSub}>{STORE_CONFIG.name}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_item: ChatMessage, idx: number) => String(idx)}
        renderItem={({ item }: { item: ChatMessage }) => renderMessage(item)}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <View style={styles.aiAvatar}>
            <Sparkles size={14} color={colors.white} />
          </View>
          <View style={styles.loadingDots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about gadgets..."
          value={input}
          onChangeText={setInput}
          editable={!loading}
          multiline
        />
        <Pressable style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]} onPress={handleSend} disabled={!input.trim() || loading}>
          <Send size={18} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    backgroundColor: colors.slate900,
  },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.white },
  headerSub: { fontSize: 12, color: "#94a3b8" },
  messagesList: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: 12 },
  msgContainer: { flexDirection: "row", gap: 8 },
  userMsgContainer: { justifyContent: "flex-end" },
  aiMsgContainer: { justifyContent: "flex-start" },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.slate900, alignItems: "center", justifyContent: "center", marginTop: 2 },
  msgBubble: { borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: colors.slate900 },
  aiBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  msgText: { fontSize: 14, lineHeight: 20 },
  userMsgText: { color: colors.white },
  aiMsgText: { color: colors.text },
  productsList: { gap: 8, marginTop: 8 },
  productCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 10 },
  productRow: { flexDirection: "row", gap: 10 },
  productImage: { width: 56, height: 56, borderRadius: radius.sm, resizeMode: "cover" },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "600", color: colors.text },
  productPrice: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 2 },
  productReason: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  productMeta: { fontSize: 11, color: colors.slate400, marginTop: 2 },
  productActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  viewBtn: { flex: 1, backgroundColor: colors.slate100, borderRadius: radius.sm, paddingVertical: 8, alignItems: "center" },
  viewBtnText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  cartBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: colors.slate900, borderRadius: radius.sm, paddingVertical: 8 },
  cartBtnDisabled: { opacity: 0.4 },
  cartBtnText: { fontSize: 12, fontWeight: "600", color: colors.white },
  loadingContainer: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: spacing.md, paddingVertical: 8 },
  loadingDots: { flexDirection: "row", gap: 4, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.slate400 },
  inputContainer: {
    flexDirection: "row", gap: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.text,
    backgroundColor: colors.background,
  },
  sendBtn: { width: 44, backgroundColor: colors.slate900, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { opacity: 0.4 },
});
