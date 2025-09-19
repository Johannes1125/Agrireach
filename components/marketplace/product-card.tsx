"use client"

import { Star, MapPin, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Product {
  id: number
  name: string
  price: number
  unit: string
  seller: string
  location: string
  category: string
  image: string
  rating: number
  inStock: boolean
  description: string
}

interface ProductCardProps {
  product: Product
  onAddToCart: (productId: number) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <article className="overflow-hidden hover:shadow-lg transition-shadow">
      <Card>
        <CardHeader className="p-0">
          <div className="relative">
            <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-48 object-cover" />
            {!product.inStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive">Out of Stock</Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold line-clamp-1">{product.name}</h3>
            <Badge variant="secondary">{product.category}</Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>

          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold text-primary">
              ${product.price}
              <span className="text-sm font-normal text-muted-foreground ml-1">{product.unit}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{product.rating}</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{product.seller}</p>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{product.location}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
          <Link href={`/marketplace/${product.id}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              View Details
            </Button>
          </Link>
          <Button onClick={() => onAddToCart(product.id)} disabled={!product.inStock} className="flex-1">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </article>
  )
}
