import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package, TrendingUp, Star, Plus, Truck } from "lucide-react"

interface User {
  id: string
  name: string
  role: string
  location: string
}

interface BuyerDashboardProps {
  user: User
}

export function BuyerDashboard({ user }: BuyerDashboardProps) {
  // Mock data - replace with actual data
  const stats = {
    activeOrders: 12,
    totalPurchases: 89,
    monthlySpend: 8450,
    savedSuppliers: 15,
  }

  const recentOrders = [
    {
      id: "1",
      product: "Organic Tomatoes",
      supplier: "Green Valley Farms",
      quantity: "500 lbs",
      price: "$1,250",
      status: "in-transit",
      deliveryDate: "2024-02-28",
    },
    {
      id: "2",
      product: "Fresh Strawberries",
      supplier: "Berry Best Farm",
      quantity: "200 lbs",
      price: "$800",
      status: "processing",
      deliveryDate: "2024-03-02",
    },
  ]

  const featuredProducts = [
    {
      id: "1",
      name: "Organic Avocados",
      supplier: "Coastal Groves",
      price: "$3.50/lb",
      rating: 4.9,
      location: "Ventura, CA",
      image: "/organic-avocados.png",
    },
    {
      id: "2",
      name: "Artisan Honey",
      supplier: "Mountain Bee Co.",
      price: "$12/jar",
      rating: 4.8,
      location: "Sonoma, CA",
      image: "/artisan-honey.jpg",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Welcome back, {user.name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">Discover fresh products from local farmers and artisans.</p>
        </div>
        <Button size="lg" className="w-fit">
          <Plus className="mr-2 h-5 w-5" />
          Browse Marketplace
        </Button>
      </header>

      {/* Stats Grid */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" aria-label="Dashboard Statistics">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">Currently processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlySpend.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Suppliers</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.savedSuppliers}</div>
            <p className="text-xs text-muted-foreground">Favorite suppliers</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <section className="lg:col-span-2" aria-label="Recent Orders">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Recent Orders</CardTitle>
              <CardDescription>Track your current and recent purchases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentOrders.map((order) => (
                <article key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">{order.product}</h4>
                    <p className="text-sm text-muted-foreground">from {order.supplier}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {order.quantity}
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Delivery {order.deliveryDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === "in-transit" ? "default" : "secondary"}>{order.status}</Badge>
                      <span className="text-sm font-medium text-primary">{order.price}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Track Order
                  </Button>
                </article>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Featured Products */}
        <aside aria-label="Featured Products">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Featured Products</CardTitle>
              <CardDescription>Fresh picks from local suppliers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {featuredProducts.map((product) => (
                <article key={product.id} className="p-3 border rounded-lg space-y-3">
                  <div className="flex gap-3">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 space-y-1">
                      <h5 className="font-medium">{product.name}</h5>
                      <p className="text-sm text-muted-foreground">{product.supplier}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{product.rating}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{product.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary">{product.price}</span>
                    <Button size="sm">Add to Cart</Button>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
