"use client"

import { useState, useEffect, use as useParams } from "react"
import { ArrowLeft, Star, MapPin, User, ShoppingCart, Heart, Share2, MessageCircle, MessageSquare, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { authFetch } from "@/lib/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { InlineLoader } from "@/components/ui/page-loader"
import { PageTransition } from "@/components/ui/page-transition"
import Link from "next/link"

interface Product {
  _id: string
  title: string
  price: number
  unit: string
  seller_id: {
    _id: string
    full_name: string
    avatar_url?: string
    location?: string
  }
  category: string
  description: string
  images: string[]
  quantity_available: number
  status: string
  organic: boolean
  created_at: string
}

interface Review {
  _id: string
  reviewer_id: {
    full_name: string
    avatar_url?: string
  }
  rating: number
  comment?: string
  created_at: string
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = useParams(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      const res = await authFetch("/api/marketplace/cart")
      if (res.ok) {
        const data = await res.json()
        const items = data.items || []
        console.log("Cart items fetched:", items) // Debug log
        // Calculate total quantity across all cart items
        const totalCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
        setCartItemCount(totalCount)
      }
    } catch (error) {
      console.error("Failed to fetch cart count:", error)
    }
  }

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/marketplace/products/${id}`)
        if (!res.ok) {
          throw new Error("Product not found")
        }
        const data = await res.json()
        const prod = data?.data?.product || data?.product || null
        if (!prod) throw new Error("Product not found")
        setProduct(prod)

        // Fetch reviews for this product's seller
        const sellerId = prod?.seller_id?._id || prod?.seller_id
        if (sellerId) {
          setReviewsLoading(true)
          try {
            const reviewsRes = await authFetch(`/api/users/${sellerId}/reviews?limit=10`)
            if (reviewsRes.ok) {
              const reviewsData = await reviewsRes.json()
              const data = reviewsData?.data || reviewsData
              const arr = data?.reviews || []
              setReviews(Array.isArray(arr) ? arr : [])
              setAverageRating(data?.stats?.averageRating || 0)
              setTotalReviews(data?.stats?.totalReviews || arr.length)
            }
          } catch (error) {
            console.error("Failed to fetch reviews:", error)
          } finally {
            setReviewsLoading(false)
          }
        } else {
          setReviews([])
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load product")
        router.push("/marketplace")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
    fetchCartCount() // Fetch cart count on page load
  }, [id, router])

  const handleSubmitReview = async () => {
    if (!product || reviewRating === 0) {
      toast.error("Please select a rating")
      return
    }

    if (!reviewComment.trim()) {
      toast.error("Please write a review comment")
      return
    }

    const sellerId = product?.seller_id?._id || product?.seller_id
    if (!sellerId) {
      toast.error("Seller information not available")
      return
    }

    try {
      setIsSubmittingReview(true)
      const res = await authFetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewee_id: sellerId,
          rating: reviewRating,
          comment: reviewComment,
          title: "Seller Review",
          category: "seller",
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to submit review")
      }

      toast.success("Review submitted successfully!")
      setReviewRating(0)
      setReviewComment("")
      setShowReviewForm(false)

      // Refresh reviews
      const reviewsRes = await authFetch(`/api/users/${sellerId}/reviews?limit=10`)
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json()
        const data = reviewsData?.data || reviewsData
        const arr = data?.reviews || []
        setReviews(Array.isArray(arr) ? arr : [])
        setAverageRating(data?.stats?.averageRating || 0)
        setTotalReviews(data?.stats?.totalReviews || arr.length)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return

    try {
      setAddingToCart(true)
      const res = await authFetch("/api/marketplace/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product._id,
          quantity,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to add to cart")
      }

      toast.success("Added to cart successfully!")
      fetchCartCount() // Update cart count after adding
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart")
    } finally {
      setAddingToCart(false)
    }
  }

  const handleContactSeller = () => {
    if (!product) return
    // Navigate to messaging or contact form
    router.push(`/messages/new?recipient=${product.seller_id._id}`)
  }

  const handleShare = async () => {
    if (!product) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard!")
      } catch (error) {
        toast.error("Failed to copy link")
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <InlineLoader text="Loading product details..." variant="spinner" size="lg" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Product not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/marketplace" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" size="sm" className="border-2 hover:bg-muted/70 dark:hover:bg-muted/50 dark:border-border dark:text-foreground">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({cartItemCount})
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted dark:bg-muted/20 ring-1 ring-border">
              <img
                src={product.images[selectedImage] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                    selectedImage === index 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-foreground font-sans">{product.title}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{product.seller_id.location || "Location not specified"}</span>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {product.category}
                </Badge>
                {product.organic && (
                  <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                    🌱 Organic
                  </Badge>
                )}
              </div>

              <div className="text-4xl font-bold text-primary mb-4">
                ₱{product.price.toFixed(2)}
                <span className="text-lg font-normal text-muted-foreground ml-2">per {product.unit}</span>
              </div>

              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Stock Info */}
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Availability</h3>
              <div className="flex items-center gap-4">
                <Badge 
                  variant="outline" 
                  className={
                    product.status === "active" && product.quantity_available > 0 
                      ? "text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20" 
                      : "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
                  }
                >
                  {product.status === "active" && product.quantity_available > 0 ? "✅ In Stock" : "❌ Out of Stock"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {product.quantity_available} {product.unit} available
                </span>
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="quantity" className="text-sm font-medium text-foreground">
                    Quantity:
                  </label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={product.quantity_available}
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                    className="w-20 bg-background border-border focus:border-primary focus:ring-primary/20"
                    disabled={product.status !== "active" || product.quantity_available === 0}
                  />
                  <span className="text-sm text-muted-foreground">{product.unit}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={product.status !== "active" || product.quantity_available === 0 || addingToCart}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {addingToCart ? "Adding..." : "Add to Cart"}
              </Button>
              <Button variant="outline" onClick={handleContactSeller}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Seller
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seller Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                <Avatar className="ring-2 ring-primary/20">
                  <AvatarImage src={product.seller_id.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {product.seller_id.full_name ? product.seller_id.full_name.split(" ").map((n) => n[0]).join("") : "S"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{product.seller_id.full_name}</p>
                  <p className="text-sm text-muted-foreground">👤 Seller</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {product.seller_id.location || "Location not specified"}
              </div>
              <div className="text-sm text-muted-foreground">
                📅 Listed on {new Date(product.created_at).toLocaleDateString()}
              </div>
              <Separator className="bg-border" />
              <Button 
                variant="outline" 
                className="w-full bg-transparent hover:bg-primary/10 border-border hover:border-primary/50 text-foreground" 
                onClick={handleContactSeller}
              >
                💬 Contact Seller
              </Button>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">📋 Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm font-medium text-foreground">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Unit</span>
                <span className="text-sm font-medium text-foreground">{product.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge 
                  variant="outline" 
                  className={
                    product.status === "active" 
                      ? "text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20" 
                      : "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
                  }
                >
                  {product.status === "active" ? "✅ Active" : "❌ Inactive"}
                </Badge>
              </div>
              {product.organic && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Certification</span>
                  <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                    🌱 Organic
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Write Review Card - Form Only */}
          <Card className="bg-card border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span>Write a Review</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Share your experience with {product?.seller_id?.full_name || 'this seller'}
              </p>
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
                    <label htmlFor="review-comment-sidebar" className="text-sm font-medium text-foreground mb-2 block">
                      Your Review
                    </label>
                    <Textarea
                      id="review-comment-sidebar"
                      placeholder="Share your experience with this seller..."
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
        </div>

        {/* Full-Width Reviews Section - Display Only */}
        <div className="mt-8">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                <span>Customer Reviews</span>
                {totalReviews > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading reviews...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review._id} className="p-4 rounded-lg border-2 border-border bg-card hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border-2 border-border flex-shrink-0">
                          <AvatarImage src={review.reviewer_id?.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {review.reviewer_id?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <p className="font-semibold text-base text-foreground">
                                {review.reviewer_id?.full_name || 'Anonymous'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(review.created_at).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating 
                                      ? "fill-yellow-400 text-yellow-400" 
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm font-medium text-foreground">{review.rating}.0</span>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-foreground leading-relaxed mt-2">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {totalReviews > reviews.length && (
                    <div className="text-center pt-4">
                      <Link href={`/reviews?reviewee_id=${product?.seller_id?._id || product?.seller_id || ''}`}>
                        <Button variant="outline" className="border-2 hover:bg-muted/70 dark:hover:bg-muted/50">
                          View All {totalReviews} Reviews
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-base font-medium text-foreground mb-2">No reviews yet</p>
                  <p className="text-sm text-muted-foreground">
                    Be the first to share your experience with this seller!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </PageTransition>
    </div>
  )
}
