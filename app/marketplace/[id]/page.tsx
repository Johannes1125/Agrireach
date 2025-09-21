"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Star,
  MapPin,
  User,
  ShoppingCart,
  Heart,
  Share2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";

// Mock product data
const product = {
  id: 1,
  name: "Organic Tomatoes",
  price: 4.99,
  unit: "per kg",
  seller: {
    name: "Green Valley Farm",
    avatar: "/farmer-avatar.png",
    rating: 4.8,
    totalSales: 156,
    joinDate: "Member since 2022",
  },
  location: "Nairobi, Kenya",
  category: "Vegetables",
  images: [
    "/fresh-organic-tomatoes.png",
    "/tomato-farm-field.jpg",
    "/tomato-harvest-basket.jpg",
  ],
  rating: 4.8,
  reviewCount: 24,
  inStock: true,
  stockQuantity: 50,
  description:
    "Premium organic tomatoes grown without pesticides or chemical fertilizers. Our tomatoes are vine-ripened for maximum flavor and nutritional value. Perfect for salads, cooking, or eating fresh.",
  features: [
    "Certified Organic",
    "Pesticide-Free",
    "Vine-Ripened",
    "Locally Grown",
    "Fresh Harvest",
  ],
  nutritionalInfo: {
    calories: "18 per 100g",
    vitamin_c: "High",
    lycopene: "Rich source",
    fiber: "Good source",
  },
};

const reviews = [
  {
    id: 1,
    user: "Sarah M.",
    rating: 5,
    date: "2 days ago",
    comment:
      "Amazing quality tomatoes! Very fresh and flavorful. Will definitely order again.",
  },
  {
    id: 2,
    user: "John K.",
    rating: 4,
    date: "1 week ago",
    comment:
      "Good quality produce. Delivery was prompt and packaging was excellent.",
  },
  {
    id: 3,
    user: "Mary L.",
    rating: 5,
    date: "2 weeks ago",
    comment:
      "Best tomatoes I've had in a long time. You can really taste the difference with organic!",
  },
];

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/marketplace"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
          >
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
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                    selectedImage === index
                      ? "border-primary"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt={"${product.name} ${index + 1}"}
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
                <h1 className="text-3xl font-bold text-foreground font-sans">
                  {product.name}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Heart
                    className={
                      'h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}'
                    }
                  />
                </Button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{product.rating}</span>
                  <span className="text-muted-foreground">
                    ({product.reviewCount} reviews)
                  </span>
                </div>
                <Badge variant="secondary">{product.category}</Badge>
              </div>

              <div className="text-4xl font-bold text-primary mb-4">
                ${product.price}
                <span className="text-lg font-normal text-muted-foreground ml-2">
                  {product.unit}
                </span>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Features */}
            <div>
              <h3 className="font-semibold mb-3">Key Features</h3>
              <div className="flex flex-wrap gap-2">
                {product.features.map((feature, index) => (
                  <Badge key={index} variant="outline">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stock and Quantity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {
                    'product.inStock ? ${product.stockQuantity} kg available : "Out of stock"'
                  }
                </span>
                <span
                  className={
                    'text-sm font-medium ${product.inStock ? "text-green-600" : "text-red-600"}'
                  }
                >
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="quantity" className="text-sm font-medium">
                    Quantity:
                  </label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={product.stockQuantity}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Number.parseInt(e.target.value) || 1)
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">kg</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button className="flex-1" disabled={!product.inStock}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Seller
              </Button>
              <Button variant="outline" size="icon">
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
                  <AvatarImage
                    src={product.seller.avatar || "/placeholder.svg"}
                  />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{product.seller.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.seller.joinDate}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Seller Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{product.seller.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Sales</span>
                <span className="font-medium">{product.seller.totalSales}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {product.location}
              </div>
              <Separator />
              <Button variant="outline" className="w-full bg-transparent">
                View Seller Profile
              </Button>
            </CardContent>
          </Card>

          {/* Nutritional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Nutritional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(product.nutritionalInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm capitalize">
                    {key.replace("_", " ")}
                  </span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{review.user}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                  {review.id !== reviews[reviews.length - 1].id && (
                    <Separator />
                  )}
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                View All Reviews
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
