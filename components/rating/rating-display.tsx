import { Star } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface RatingDisplayProps {
  rating: number
  reviewCount?: number
  showDistribution?: boolean
  distribution?: number[]
  size?: "sm" | "md" | "lg"
}

export function RatingDisplay({
  rating,
  reviewCount = 0,
  showDistribution = false,
  distribution = [65, 25, 8, 1, 1],
  size = "md",
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  return (
    <div className="space-y-3">
      {/* Main Rating */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`${sizeClasses[size]} ${
                star <= Math.floor(rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : star === Math.ceil(rating) && rating % 1 !== 0
                    ? "fill-yellow-400/50 text-yellow-400"
                    : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className={`font-semibold ${textSizeClasses[size]}`}>{rating.toFixed(1)}</span>
        {reviewCount > 0 && (
          <span className={`text-muted-foreground ${textSizeClasses[size]}`}>
            ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
          </span>
        )}
      </div>

      {/* Rating Distribution */}
      {showDistribution && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Rating Distribution</h4>
          {[5, 4, 3, 2, 1].map((stars, index) => (
            <div key={stars} className="flex items-center gap-2 text-sm">
              <span className="w-4">{stars}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <Progress value={distribution[index]} className="flex-1 h-2" />
              <span className="text-muted-foreground w-8 text-right">{distribution[index]}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
