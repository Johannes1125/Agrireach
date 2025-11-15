"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, MessageSquare, CheckCircle } from "lucide-react"
import { authFetch } from "@/lib/auth-client"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface WriteReviewCardProps {
  companyName: string
  posterId?: string
  onReviewSubmitted?: () => void
}

interface ExistingReview {
  _id: string
  rating: number
  comment?: string
  created_at: string
}

export function WriteReviewCard({ companyName, posterId, onReviewSubmitted }: WriteReviewCardProps) {
  const { user } = useAuth()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [existingReview, setExistingReview] = useState<ExistingReview | null>(null)
  const [isCheckingReview, setIsCheckingReview] = useState(true)

  // Hide the card if user is the poster (can't review yourself)
  const isPoster = user && posterId && String(user.id) === String(posterId)

  // Check if user has already reviewed this company
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!posterId || !user?.id) {
        setIsCheckingReview(false)
        return
      }

      try {
        const res = await authFetch(`/api/reviews?reviewee_id=${posterId}&reviewer_id=${user.id}&limit=1`)
        if (res.ok) {
          const data = await res.json()
          const reviews = data?.reviews || []
          if (reviews.length > 0) {
            setExistingReview(reviews[0])
          }
        }
      } catch (error) {
        console.error("Error checking existing review:", error)
      } finally {
        setIsCheckingReview(false)
      }
    }

    checkExistingReview()
  }, [posterId, user?.id])

  const handleSubmitReview = async () => {
    if (!posterId || reviewRating === 0 || !reviewComment.trim()) {
      toast.error("Please provide a rating and comment")
      return
    }

    setIsSubmittingReview(true)
    try {
      const res = await authFetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewee_id: posterId,
          rating: reviewRating,
          comment: reviewComment.trim(),
          title: "Company Review",
          category: "Seller Review",
        }),
      })

      if (res.ok) {
        toast.success("Review submitted successfully!")
        setReviewRating(0)
        setReviewComment("")
        setShowReviewForm(false)
        // Refresh existing review
        const refreshRes = await authFetch(`/api/reviews?reviewee_id=${posterId}&reviewer_id=${user?.id}&limit=1`)
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          const reviews = data?.reviews || []
          if (reviews.length > 0) {
            setExistingReview(reviews[0])
          }
        }
        onReviewSubmitted?.()
      } else {
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData?.error || errorData?.message || `Failed to submit review (${res.status})`
        console.error("Review submission error:", errorData)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Failed to submit review")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (!posterId) {
    return null
  }

  // Hide the card if user is the poster (can't review yourself)
  if (isPoster) {
    return null
  }

  if (isCheckingReview) {
    return (
      <Card className="bg-card border-2">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Checking review status...</p>
        </CardContent>
      </Card>
    )
  }

  // Show existing review if user has already reviewed
  if (existingReview) {
    return (
      <Card className="bg-card border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Your Review</span>
          </CardTitle>
          <CardDescription className="text-sm">
            You've already reviewed {companyName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border-2 border-border bg-muted/50 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Rating:</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < existingReview.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {existingReview.rating}.0
                </span>
              </div>
            </div>
            {existingReview.comment && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Your Comment:</p>
                <p className="text-sm text-foreground leading-relaxed">{existingReview.comment}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Reviewed on {new Date(existingReview.created_at).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <span>Write a Review</span>
        </CardTitle>
        <CardDescription className="text-sm">
          Share your experience with {companyName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showReviewForm ? (
          <Button 
            onClick={() => setShowReviewForm(true)}
            className="w-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Write a Review
          </Button>
        ) : (
          <div className="p-4 rounded-lg border-2 border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-base">Write Your Review</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReviewForm(false)
                  setReviewRating(0)
                  setReviewComment("")
                }}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Rating</label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewRating(rating)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating <= reviewRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
                {reviewRating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {reviewRating} {reviewRating === 1 ? 'star' : 'stars'}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="review-comment-job-opportunity" className="text-sm font-medium text-foreground mb-2 block">
                Your Review
              </label>
              <Textarea
                id="review-comment-job-opportunity"
                placeholder="Share your experience with this company..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                className="bg-background border-border resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || reviewRating === 0 || !reviewComment.trim()}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewForm(false)
                  setReviewRating(0)
                  setReviewComment("")
                }}
                className="border-2 hover:bg-muted/70 dark:hover:bg-muted/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

