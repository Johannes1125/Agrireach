import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building, MapPin, Calendar, Star, Package, Phone, Mail, Globe } from "lucide-react"

interface User {
  id: string
  name: string
  role: string
  location: string
}

interface BuyerProfileProps {
  user: User
}

export function BuyerProfile({ user }: BuyerProfileProps) {
  // Mock data - replace with actual data
  const businessInfo = {
    name: "Fresh Market Distribution Co.",
    type: "Wholesale Food Distribution",
    size: "25-50 employees",
    founded: "2018",
    website: "www.freshmarketdist.com",
    description:
      "Regional distributor specializing in fresh, locally-sourced agricultural products for restaurants, grocery stores, and institutional buyers across California.",
  }

  const recentOrders = [
    {
      id: "1",
      product: "Organic Tomatoes",
      supplier: "Green Valley Farms",
      quantity: "500 lbs",
      amount: 1250,
      date: "2024-02-20",
      status: "delivered",
    },
    {
      id: "2",
      product: "Fresh Strawberries",
      supplier: "Berry Best Farm",
      quantity: "200 lbs",
      amount: 800,
      date: "2024-02-18",
      status: "delivered",
    },
    {
      id: "3",
      product: "Artisan Cheese",
      supplier: "Mountain Dairy Co.",
      quantity: "50 units",
      amount: 600,
      date: "2024-02-15",
      status: "delivered",
    },
  ]

  const stats = {
    totalOrders: 234,
    totalSpent: 125600,
    averageRating: 4.9,
    preferredSuppliers: 18,
  }

  const supplierReviews = [
    {
      id: "1",
      supplier: "Green Valley Farms",
      rating: 5,
      comment:
        "Consistently high-quality produce and reliable delivery schedules. Excellent communication throughout the ordering process.",
      date: "2024-02-22",
    },
    {
      id: "2",
      supplier: "Berry Best Farm",
      rating: 5,
      comment:
        "Outstanding strawberries with perfect ripeness. Great packaging that maintains freshness during transport.",
      date: "2024-02-19",
    },
  ]

  const preferences = [
    "Organic Certified Products",
    "Local Suppliers (within 100 miles)",
    "Sustainable Farming Practices",
    "Bulk Ordering (500+ lbs)",
    "Weekly Delivery Schedule",
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Business Information</CardTitle>
            <CardDescription>About {businessInfo.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Type: {businessInfo.type}</span>
              </div>

              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Size: {businessInfo.size}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Founded: {businessInfo.founded}</span>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a href={`https://${businessInfo.website}`} className="text-sm text-primary hover:underline">
                  {businessInfo.website}
                </a>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">{businessInfo.description}</p>
          </CardContent>
        </Card>

        {/* Recent Purchase History */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Recent Purchase History</CardTitle>
            <CardDescription>Latest orders and transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{order.product}</h4>
                  <p className="text-sm text-muted-foreground">from {order.supplier}</p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {order.quantity}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {order.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{order.status}</Badge>
                    <span className="text-sm font-medium text-primary">${order.amount.toLocaleString()}</span>
                  </div>
                </div>

                <Button variant="outline" size="sm">
                  Reorder
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Supplier Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Supplier Reviews</CardTitle>
            <CardDescription>Feedback on recent purchases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplierReviews.map((review) => (
              <div key={review.id} className="border-l-2 border-primary/20 pl-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">{review.supplier}</h5>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                <p className="text-xs text-muted-foreground">{review.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Purchase Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Purchase Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Orders</span>
              <span className="font-medium">{stats.totalOrders}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Spent</span>
              <span className="font-medium">${stats.totalSpent.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Rating</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{stats.averageRating}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Preferred Suppliers</span>
              <span className="font-medium">{stats.preferredSuppliers}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">orders@freshmarketdist.com</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">(415) 555-0198</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.location}</span>
            </div>
          </CardContent>
        </Card>

        {/* Buying Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Buying Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {preferences.map((preference, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">{preference}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Verification Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Business License</span>
              <Badge variant="secondary">Verified</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Payment Method</span>
              <Badge variant="secondary">Verified</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Credit Check</span>
              <Badge variant="secondary">Verified</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
