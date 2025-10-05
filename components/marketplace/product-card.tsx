"use client";

import { useState } from "react";
import { Star, MapPin, ShoppingCart, Info, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/components/accessibility/accessibility-provider";
import { Tooltip } from "@/components/ui/tooltip";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  seller: string;
  location: string;
  category: string;
  image: string;
  rating: number;
  inStock: boolean;
  description: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { announce } = useAccessibility();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    if (!product.inStock) return;

    onAddToCart(product.id);
    setAddedToCart(true);
    announce(`${product.name} added to your cart`);

    setTimeout(() => {
      setAddedToCart(false);
    }, 2000);
  };

  // Format price for screen readers
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price);

  return (
    <article
      className="overflow-hidden rounded-md transition-all hover:shadow-lg focus-within:ring-2 focus-within:ring-primary"
      aria-labelledby={`product-title-${product.id}`}
    >
      <Card>
        <CardHeader className="p-0">
          <div className="relative">
            {/* Use next/image for better performance and automatic webp format */}
            <div className="relative h-48 w-full bg-muted">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              )}
              <Image
                src={product.image || "/placeholder.svg"}
                alt={`Photo of ${product.name}, a ${product.category} product from ${product.seller}`}
                className={`h-full w-full object-cover transition-opacity ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
              />
            </div>
            {!product.inStock && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/50"
                aria-live="polite"
              >
                <Badge variant="destructive" className="text-sm font-medium">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <h3
              id={`product-title-${product.id}`}
              className="text-lg font-semibold line-clamp-1"
            >
              {product.name}
            </h3>
            <Badge variant="secondary" className="ml-2 shrink-0">
              {product.category}
            </Badge>
          </div>

          <p
            className="mb-2 text-sm text-muted-foreground line-clamp-2"
            id={`product-description-${product.id}`}
          >
            {product.description}
          </p>

          <div className="mb-2 flex items-center justify-between">
            <div
              className="text-2xl font-bold text-primary"
              aria-label={`Price: ${formattedPrice} per ${product.unit}`}
            >
              ${product.price.toFixed(2)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                /{product.unit}
              </span>
            </div>
            <div
              className="flex items-center gap-1"
              aria-label={`Rated ${product.rating} out of 5 stars`}
            >
              <Star
                className="h-4 w-4 fill-yellow-400 text-yellow-400"
                aria-hidden="true"
              />
              <span className="text-sm">{product.rating}</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{product.seller}</p>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              <span>{product.location}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 p-4 pt-0">
          <Link
            href={`/marketplace/${product.id}`}
            className="flex-1"
            aria-label={`View details of ${product.name}`}
            aria-describedby={`product-title-${product.id} product-description-${product.id}`}
          >
            <Button variant="outline" className="w-full bg-transparent">
              <Info className="mr-2 h-4 w-4" aria-hidden="true" />
              View Details
            </Button>
          </Link>
          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock || addedToCart}
            className="flex-1"
            aria-label={
              !product.inStock
                ? `${product.name} is out of stock`
                : addedToCart
                ? `${product.name} added to cart`
                : `Add ${product.name} to cart for ${formattedPrice}`
            }
          >
            {addedToCart ? (
              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
            ) : (
              <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {addedToCart ? "Added" : "Add to Cart"}
          </Button>
        </CardFooter>
      </Card>
    </article>
  );
}
