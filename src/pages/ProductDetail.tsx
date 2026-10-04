import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Zap, ArrowLeft, Check, Truck, ShieldCheck, RotateCcw, Sparkles, Minus, Plus, Star } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/services/productService";
import { getProductReviews, addReview } from "@/services/reviewService";
import type { Product, Review } from "@/types";
import { formatPrice, getDiscountPercentage, formatDate } from "@/lib/utils";
import { StarRating } from "@/components/StarRating";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    async function load() {
      if (!slug) return;
      try {
        const p = await getProductBySlug(slug);
        setProduct(p);
        if (p) {
          setActiveImage(0);
          setQuantity(1);
          const [rel, revs] = await Promise.all([
            getRelatedProducts(p.category_id, p.id, 4),
            getProductReviews(p.id),
          ]);
          setRelated(rel);
          setReviews(revs);
        }
      } catch (err) {
        console.error("Product load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  async function handleAddToCart() {
    if (!product) return;
    setAdding(true);
    const { error } = await addToCart(product, quantity);
    setAdding(false);
    if (error) {
      showToast(error, "error");
    } else {
      showToast("Added to cart!", "success");
    }
  }

  async function handleBuyNow() {
    if (!product) return;
    setBuying(true);
    const { error } = await addToCart(product, quantity);
    setBuying(false);
    if (error) {
      showToast(error, "error");
    } else {
      navigate("/cart");
    }
  }

  async function handleSubmitReview() {
    if (!product || !user) return;
    setSubmittingReview(true);
    const { error } = await addReview(product.id, reviewRating, reviewComment.trim());
    setSubmittingReview(false);
    if (error) {
      showToast(error, "error");
    } else {
      showToast("Review submitted!", "success");
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
      const revs = await getProductReviews(product.id);
      setReviews(revs);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-slate-100" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-24 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-12 w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Product not found</h1>
        <p className="text-slate-500 mt-2">The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/shop" className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Back to Shop
        </Link>
      </div>
    );
  }

  const discount = getDiscountPercentage(product.price, product.compare_at_price);
  const images = product.images && product.images.length > 0 ? product.images : [product.image_url].filter(Boolean) as string[];
  const outOfStock = product.stock_quantity === 0;
  const specs = Object.entries(product.specifications || {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-700">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-slate-700">Shop</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/shop?category=${product.category.slug}`} className="hover:text-slate-700">{product.category.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-900 truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Images */}
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white">
            {images[activeImage] && (
              <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`h-20 w-20 overflow-hidden rounded-lg border-2 transition ${
                    activeImage === idx ? "border-slate-900" : "border-slate-200"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{product.category.name}</span>
          )}
          <h1 className="mt-1 text-3xl font-bold text-slate-900">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={product.rating} size={18} showNumber reviewCount={product.review_count} />
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">{formatPrice(product.price)}</span>
            {product.compare_at_price && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatPrice(product.compare_at_price)}</span>
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                  Save {discount}%
                </span>
              </>
            )}
          </div>

          <p className="mt-4 text-slate-600 leading-relaxed">{product.description}</p>

          {/* Stock */}
          <div className="mt-4 flex items-center gap-2">
            {outOfStock ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-rose-600">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Out of Stock
              </span>
            ) : product.stock_quantity <= 10 ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Only {product.stock_quantity} left in stock
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <Check className="h-4 w-4" /> In Stock ({product.stock_quantity} available)
              </span>
            )}
          </div>

          {/* Quantity & Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center rounded-lg border border-slate-200">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 text-slate-600 hover:bg-slate-50 rounded-l-lg"
                disabled={outOfStock}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 py-2.5 text-sm font-semibold text-slate-900 min-w-[3rem] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                className="p-2.5 text-slate-600 hover:bg-slate-50 rounded-r-lg"
                disabled={outOfStock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={outOfStock || adding}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-900 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
              {adding ? "Adding..." : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={outOfStock || buying}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {buying ? "Processing..." : "Buy Now"}
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-200 pt-6">
            <div className="flex flex-col items-center text-center">
              <Truck className="h-5 w-5 text-slate-700 mb-1" />
              <p className="text-xs text-slate-600">Free shipping over $100</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <ShieldCheck className="h-5 w-5 text-slate-700 mb-1" />
              <p className="text-xs text-slate-600">Secure checkout</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <RotateCcw className="h-5 w-5 text-slate-700 mb-1" />
              <p className="text-xs text-slate-600">30-day returns</p>
            </div>
          </div>

          {/* AI CTA */}
          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-slate-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Not sure if this is right for you?</p>
                <p className="text-sm text-slate-600 mt-0.5">Ask our AI shopping assistant for a personalized recommendation based on your needs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {specs.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Specifications</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <tbody>
                {specs.map(([key, value], idx) => (
                  <tr key={key} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                    <td className="px-4 py-3 font-medium text-slate-900 w-1/3">{key}</td>
                    <td className="px-4 py-3 text-slate-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Customer Reviews ({reviews.length})</h2>
          {user && !outOfStock && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Write a Review
            </button>
          )}
        </div>

        {showReviewForm && (
          <div className="mb-6 rounded-xl border border-slate-200 p-4 bg-slate-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-slate-700">Your Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewRating(star)}>
                  <Star className={`h-5 w-5 ${star <= reviewRating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
              <button
                onClick={() => setShowReviewForm(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">
            <p className="text-slate-500">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {(review.profile?.full_name || "A")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{review.profile?.full_name || "Anonymous"}</p>
                    <p className="text-xs text-slate-400">{formatDate(review.created_at)}</p>
                  </div>
                  <div className="ml-auto">
                    <StarRating rating={review.rating} size={14} />
                  </div>
                </div>
                {review.comment && <p className="text-sm text-slate-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Related Products</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
