import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
  reviewCount?: number;
}

export function StarRating({ rating, size = 16, showNumber = false, reviewCount }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200"
            }
          />
        ))}
      </div>
      {showNumber && (
        <span className="text-sm font-medium text-slate-600">
          {rating.toFixed(1)}
          {reviewCount !== undefined && (
            <span className="text-slate-400"> ({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  );
}
