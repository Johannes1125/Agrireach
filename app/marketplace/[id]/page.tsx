"use client"

import { useState, useEffect, use as useParams } from "react"
import { ArrowLeft, Star, MapPin, User, ShoppingCart, Heart, Share2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { authFetch } from "@/lib/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
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
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/marketplace/products/${id}`)
        if (!res.ok) {
          throw new Error("Product not found")
        }
        const data = await res.json()
        setProduct(data.product)

        // Fetch reviews for this product's seller
        const reviewsRes = await authFetch(`/api/reviews?reviewee_id=${data.product.seller_id._id}&limit=10`)
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json()
          setReviews(reviewsData.reviews || [])
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load product")
        router.push("/marketplace")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, router])

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
        <div>Loading...</div>
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
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/marketplace" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
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
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                    selectedImage === index ? "border-primary" : "border-gray-200"
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
                <Badge variant="secondary">{product.category}</Badge>
                {product.organic && (
                  <Badge variant="outline" className="text-green-600">
                    Organic
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
              <h3 className="font-semibold mb-3">Availability</h3>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className={product.status === "active" && product.quantity_available > 0 ? "text-green-600" : "text-red-600"}>
                  {product.status === "active" && product.quantity_available > 0 ? "In Stock" : "Out of Stock"}
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
                  <label htmlFor="quantity" className="text-sm font-medium">
                    Quantity:
                  </label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={product.quantity_available}
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                    className="w-20"
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={product.seller_id.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {product.seller_id.full_name ? product.seller_id.full_name.split(" ").map((n) => n[0]).join("") : "S"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{product.seller_id.full_name}</p>
                  <p className="text-sm text-muted-foreground">Seller</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {product.seller_id.location || "Location not specified"}
              </div>
              <div className="text-sm text-muted-foreground">
                Listed on {new Date(product.created_at).toLocaleDateString()}
              </div>
              <Separator />
              <Button variant="outline" className="w-full bg-transparent" onClick={handleContactSeller}>
                Contact Seller
              </Button>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Category</span>
                <span className="text-sm font-medium">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Unit</span>
                <span className="text-sm font-medium">{product.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Status</span>
                <span className="text-sm font-medium capitalize">{product.status}</span>
              </div>
              {product.organic && (
                <div className="flex justify-between">
                  <span className="text-sm">Organic</span>
                  <span className="text-sm font-medium text-green-600">Yes</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Seller Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviews.length > 0 ? (
                reviews.slice(0, 3).map((review) => (
                  <div key={review._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{review.reviewer_id.full_name}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                    {review._id !== reviews[reviews.length - 1]._id && <Separator />}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet for this seller.</p>
              )}
              {reviews.length > 3 && (
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  View All Reviews ({reviews.length})
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
