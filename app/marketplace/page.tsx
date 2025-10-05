"use client"

import { useState, useEffect } from "react"
import { Search, Grid, List, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SimpleHeader } from "@/components/layout/simple-header"
import { useMarketplaceData } from "@/hooks/use-marketplace-data"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"



export default function MarketplacePage() {
  const { user, loading: authLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [cartItems, setCartItems] = useState<string[]>([])

  const { products, categories, loading, error, total } = useMarketplaceData({
    search: searchTerm || undefined,
    category: selectedCategory || undefined,
    sortBy,
    limit: 20
  })

  if (authLoading) {
    return <div>Loading...</div>
  }

  const addToCart = (productId: string) => {
    setCartItems((prev) => [...prev, productId])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleHeader />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading marketplace...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleHeader />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-destructive">Error loading marketplace: {error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader user={user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        location: user.location || "Not specified",
      } : undefined} />

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
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id || category} value={category.name || category}>
                    {category.name || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
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
          {products.map((product) => (
            <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="relative">
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                  {product.quantity_available <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  )}
                  {product.organic && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Organic</Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
<CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg font-semibold">{product.title}</CardTitle>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-2">{product.description}</p>

                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-primary">
                    ₱{product.price}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{product.unit}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {product.quantity_available} available
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{product.seller_id?.full_name}</p>
                  <p>{product.seller_id?.location}</p>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0 flex gap-2">
                <Link href={`/marketplace/${product._id}`} className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    View Details
                  </Button>
                </Link>
                <Button onClick={() => addToCart(product._id)} disabled={product.quantity_available <= 0} className="flex-1">
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}