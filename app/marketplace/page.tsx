"use client"

import { useState } from "react"
import { Search, Grid, List, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SimpleHeader } from "@/components/layout/simple-header"
import Link from "next/link"

// Mock product data
const products = [
  {
    id: 1,
    name: "Organic Tomatoes",
    price: 4.99,
    unit: "per kg",
    seller: "Green Valley Farm",
    location: "Nairobi, Kenya",
    category: "Vegetables",
    image: "/fresh-organic-tomatoes.png",
    rating: 4.8,
    inStock: true,
    description: "Fresh organic tomatoes grown without pesticides",
  },
  {
    id: 2,
    name: "Fresh Tilapia Fish",
    price: 8.5,
    unit: "per kg",
    seller: "Lake Victoria Fishers",
    location: "Kisumu, Kenya",
    category: "Fish & Seafood",
    image: "/fresh-tilapia-fish.jpg",
    rating: 4.6,
    inStock: true,
    description: "Freshly caught tilapia from Lake Victoria",
  },
  {
    id: 3,
    name: "Handwoven Baskets",
    price: 15.0,
    unit: "each",
    seller: "Artisan Crafts Co.",
    location: "Nakuru, Kenya",
    category: "Crafts",
    image: "/handwoven-traditional-baskets.jpg",
    rating: 4.9,
    inStock: true,
    description: "Traditional handwoven baskets made from local materials",
  },
  {
    id: 4,
    name: "Organic Maize",
    price: 2.3,
    unit: "per kg",
    seller: "Sunrise Farm",
    location: "Eldoret, Kenya",
    category: "Grains",
    image: "/organic-maize-corn.jpg",
    rating: 4.7,
    inStock: true,
    description: "Premium organic maize, perfect for various uses",
  },
  {
    id: 5,
    name: "Fresh Milk",
    price: 1.2,
    unit: "per liter",
    seller: "Highland Dairy",
    location: "Meru, Kenya",
    category: "Dairy",
    image: "/fresh-dairy-milk.jpg",
    rating: 4.5,
    inStock: false,
    description: "Fresh cow milk from grass-fed cattle",
  },
  {
    id: 6,
    name: "Pottery Collection",
    price: 25.0,
    unit: "per set",
    seller: "Clay Masters",
    location: "Machakos, Kenya",
    category: "Crafts",
    image: "/traditional-pottery-ceramics.jpg",
    rating: 4.8,
    inStock: true,
    description: "Beautiful handcrafted pottery set",
  },
]

const categories = ["All", "Vegetables", "Fruits", "Grains", "Fish & Seafood", "Dairy", "Crafts", "Livestock"]

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState("name")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [cartItems, setCartItems] = useState<number[]>([])

  const filteredProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "All" || product.category === selectedCategory),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return b.rating - a.rating
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const addToCart = (productId: number) => {
    setCartItems((prev) => [...prev, productId])
  }

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
<div>
              <h1 className="text-3xl font-bold text-foreground font-sans">AgriReach Marketplace</h1>
              <p className="text-muted-foreground mt-1">Fresh products directly from farmers, fishers, and artisans</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({cartItems.length})
              </Button>
              <Link href="/marketplace/sell">
                <Button className="bg-primary hover:bg-primary/90">Sell Products</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
          }
        >
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="relative">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
<CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-2">{product.description}</p>

                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-primary">
                    ${product.price}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{product.unit}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm">{product.rating}</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{product.seller}</p>
                  <p>{product.location}</p>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0 flex gap-2">
                <Link href={'/marketplace/${product.id}'} className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    View Details
                  </Button>
                </Link>
                <Button onClick={() => addToCart(product.id)} disabled={!product.inStock} className="flex-1">
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}