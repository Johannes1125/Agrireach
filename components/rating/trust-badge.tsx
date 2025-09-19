import { Shield, Award, Star, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TrustBadgeProps {
  trustScore: number
  reviewCount?: number
  isVerified?: boolean
  size?: "sm" | "md" | "lg"
  showScore?: boolean
}

export function TrustBadge({
  trustScore,
  reviewCount = 0,
  isVerified = false,
  size = "md",
  showScore = true,
}: TrustBadgeProps) {
  const getTrustLevel = (score: number) => {
    if (score >= 4.5) return { level: "Elite", color: "bg-purple-500", icon: Award }
    if (score >= 4.0) return { level: "Highly Trusted", color: "bg-green-500", icon: Shield }
    if (score >= 3.0) return { level: "Trusted", color: "bg-blue-500", icon: CheckCircle }
    return { level: "New Member", color: "bg-gray-500", icon: Shield }
  }

  const trust = getTrustLevel(trustScore)
  const IconComponent = trust.icon

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Trust Level Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className={`${trust.color} text-white hover:${trust.color}/90`}>
              <IconComponent className={`${sizeClasses[size]} mr-1`} />
              <span className={textSizeClasses[size]}>{trust.level}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Trust Level: {trust.level}</p>
            <p>Based on {reviewCount} reviews</p>
          </TooltipContent>
        </Tooltip>

        {/* Trust Score */}
        {showScore && (
          <div className="flex items-center gap-1">
            <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
            <span className={`font-medium ${textSizeClasses[size]}`}>{trustScore.toFixed(1)}</span>
            {reviewCount > 0 && (
              <span className={`text-muted-foreground ${textSizeClasses[size]}`}>({reviewCount})</span>
            )}
          </div>
        )}

        {/* Verified Badge */}
        {isVerified && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className={`${sizeClasses[size]} mr-1`} />
                <span className={textSizeClasses[size]}>Verified</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Identity verified by AgriReach</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
