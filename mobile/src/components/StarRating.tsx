import { View, Text, StyleSheet } from "react-native";
import { Star } from "lucide-react-native";
import { colors } from "@/config/theme";

interface StarRatingProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
  reviewCount?: number;
}

export function StarRating({ rating, size = 16, showNumber = false, reviewCount }: StarRatingProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            color={star <= Math.round(rating) ? colors.amber : colors.slate200}
            fill={star <= Math.round(rating) ? colors.amber : colors.slate200}
          />
        ))}
      </View>
      {showNumber && (
        <Text style={styles.number}>
          {rating.toFixed(1)}
          {reviewCount !== undefined && (
            <Text style={styles.count}> ({reviewCount})</Text>
          )}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  number: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  count: {
    color: colors.slate400,
  },
});
