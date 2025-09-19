"use client"

import { Star, ThumbsUp, Flag, MoreHorizontal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TrustBadge } from "./trust-badge"

interface Review {
  id: number
  reviewer: {
    name: string
    avatar: string
    trustScore: number
  }
  rating: number
  title: string
  content: string
  date: string
  verified: boolean
  helpful: number
  category: string
}

interface ReviewCardProps {
  review: Review
  onHelpful?: (reviewId: number) => void
  onReport?: (reviewId: number) => void
}

export function ReviewCard({ review, onHelpful, onReport }: ReviewCardProps) {
  return (
    <article className="hover:shadow-md transition-shadow">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={review.reviewer.avatar || "/placeholder.svg"} />
              <AvatarFallback>{review.reviewer.name[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{review.reviewer.name}</span>
                    <TrustBadge
                      trustScore={review.reviewer.trustScore}
                      isVerified={review.verified}
                      size="sm"
                      showScore={false}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{review.date}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onReport?.(review.id)}>
                      <Flag className="h-4 w-4 mr-2" />
                      Report Review
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold mb-2">{review.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">{review.content}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{review.category}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => onHelpful?.(review.id)}>
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Helpful ({review.helpful})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </article>
  )
}
