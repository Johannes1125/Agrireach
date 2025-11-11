"use client";

import { useState, useEffect } from "react";
import { Search, Grid, List, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMarketplaceData } from "@/hooks/use-marketplace-data";
import { useAuth } from "@/hooks/use-auth";
import { authFetch } from "@/lib/auth-client";
import { toast } from "sonner";
import { CheckoutModal } from "@/components/marketplace/checkout-modal";
import { ShoppingCartComponent } from "@/components/marketplace/shopping-cart";
import { PageTransition } from "@/components/ui/page-transition";
import { InlineLoader } from "@/components/ui/page-loader";
import { ProductCardSkeleton } from "@/components/ui/skeleton-loader";
import Link from "next/link";

export default function MarketplacePage() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Use debouncedSearch to avoid firing a request on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, sortBy]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const { products, categories, loading, error, total, pages } = useMarketplaceData({
    search: debouncedSearch || undefined,
    category: selectedCategory || undefined,
    sortBy,
    page: currentPage,
    limit: 20,
  });

  // Fetch cart items
  const fetchCart = async () => {
    setCartLoading(true);
    try {
      const res = await authFetch("/api/marketplace/cart");
      if (res.ok) {
        const data = await res.json();
        console.log("Cart data received:", data); // Debug log
        setCartItems(data.data?.items || data.items || []);
      } else if (res.status === 401) {
        // User not logged in, just clear cart
        setCartItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <InlineLoader
          text="Loading marketplace..."
          variant="spinner"
          size="lg"
        />
      </div>
    );
  }

  const addToCart = async (productId: string) => {
    try {
      const res = await authFetch("/api/marketplace/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add to cart");
      }

      toast.success("Item added to cart!");
      fetchCart(); // Refresh cart
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      const res = await authFetch(`/api/marketplace/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update cart item");
      }

      toast.success("Cart updated!");
      fetchCart(); // Refresh cart
    } catch (error: any) {
      toast.error(error.message || "Failed to update cart item");
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const res = await authFetch(`/api/marketplace/cart/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to remove from cart");
      }

      toast.success("Item removed from cart!");
      fetchCart(); // Refresh cart
    } catch (error: any) {
      toast.error(error.message || "Failed to remove from cart");
    }
  };

  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    fetchCart(); // Refresh cart after successful checkout
    toast.success("Order placed successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader
        user={
          user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                // cast role to expected union
                role: user.role as unknown as "worker" | "recruiter" | "buyer",
                avatar: user.avatar || "",
                location: user.location || "Not specified",
              }
            : undefined
        }
      />

      <PageTransition>
        {/* Header */}
        <div className="bg-background border-b">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-sans">
                  AgriReach Marketplace
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Fresh products directly from farmers, fishers, and artisans
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <ShoppingCartComponent
                  items={cartItems.map((item) => ({
                    id: item._id,
                    name: item.product_id?.title || "Unknown Product",
                    price: item.product_id?.price || 0,
                    quantity: item.quantity,
                    image: item.product_id?.images?.[0] || "/placeholder.svg",
                    seller:
                      item.product_id?.seller_id?.full_name || "Unknown Seller",
                    unit: item.product_id?.unit || "kg",
                  }))}
                  onUpdateQuantity={(id: number, quantity: number) => {
                    // Handle quantity update
                    updateCartItem(String(id), quantity);
                  }}
                  onRemoveItem={(id: number) => {
                    // Handle item removal
                    removeFromCart(String(id));
                  }}
                  onCheckout={() => {
                    if (cartItems.length === 0) {
                      toast.info("Your cart is empty");
                      return;
                    }
                    setShowCheckout(true);
                  }}
                />
                <Link href="/marketplace/sell">
                  <Button className="bg-primary hover:bg-primary/90">
                    Sell Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
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
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-40 bg-white text-zinc-900 border border-white/60 focus:ring-0 focus-visible:ring-0 dark:bg-white/5 dark:text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category, index) => {
                    const isObject =
                      typeof category === "object" && category !== null;
                    const categoryKey =
                      isObject && category._id
                        ? category._id
                        : `category-${index}`;
                    const categoryName =
                      isObject && category.name ? category.name : category;
                    return (
                      <SelectItem key={categoryKey} value={categoryName}>
                        {categoryName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40 bg-white text-zinc-900 border border-white/60 focus:ring-0 focus-visible:ring-0 dark:bg-white/5 dark:text-white">
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
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
                : "space-y-3 sm:space-y-4"
            }
          >
            {loading
              ? // Show skeleton loaders while loading
                Array.from({ length: 8 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))
              : products.map((product) => (
                  <Card
                    key={product._id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
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
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              Organic
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg font-semibold">
                          {product.title}
                        </CardTitle>
                        <Badge variant="secondary">{product.category}</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-bold text-primary">
                          ₱{product.price}
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            {product.unit}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {product.quantity_available} available
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium">
                          {product.seller_id?.full_name}
                        </p>
                        <p>{product.seller_id?.location}</p>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 flex gap-2">
                      <Link
                        href={`/marketplace/${product._id}`}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                        >
                          View Details
                        </Button>
                      </Link>
                      <Button
                        onClick={() => addToCart(product._id)}
                        disabled={product.quantity_available <= 0}
                        className="flex-1"
                      >
                        Add to Cart
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
          </div>

          {products.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No products found matching your criteria.
              </p>
            </div>
          )}
        </div>

        {/* Checkout Modal */}
        <CheckoutModal
          open={showCheckout}
          onClose={() => setShowCheckout(false)}
          cartItems={cartItems}
          onSuccess={handleCheckoutSuccess}
        />
      </PageTransition>
    </div>
  );
}
