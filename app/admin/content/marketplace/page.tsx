import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function MarketplaceContentPage() {
  // Mock data for marketplace products
  const products = [
    {
      id: "1",
      name: "Organic Tomatoes",
      seller: "Green Valley Farms",
      category: "Vegetables",
      price: "$3.50/lb",
      stock: 500,
      status: "active",
      views: 1240,
      orders: 45,
      rating: 4.8,
      flagged: false,
      createdAt: "2024-02-15",
    },
    {
      id: "2",
      name: "Fresh Strawberries",
      seller: "Berry Best Farm",
      category: "Fruits",
      price: "$4.00/lb",
      stock: 200,
      status: "active",
      views: 890,
      orders: 32,
      rating: 4.9,
      flagged: false,
      createdAt: "2024-02-18",
    },
    {
      id: "3",
      name: "Artisan Honey",
      seller: "Mountain Bee Co.",
      category: "Pantry",
      price: "$12.00/jar",
      stock: 0,
      status: "out_of_stock",
      views: 567,
      orders: 18,
      rating: 4.7,
      flagged: false,
      createdAt: "2024-02-10",
    },
    {
      id: "4",
      name: "Suspicious Product",
      seller: "Unknown Seller",
      category: "Other",
      price: "$1.00/lb",
      stock: 1000,
      status: "pending",
      views: 23,
      orders: 0,
      rating: 0,
      flagged: true,
      createdAt: "2024-02-22",
    },
  ]

  const stats = {
    totalProducts: 1247,
    activeProducts: 1156,
    pendingReview: 23,
    flaggedProducts: 8,
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Marketplace Content</h1>
          <p className="text-muted-foreground">Manage products, listings, and marketplace content</p>
        </div>
        <Button>Add Product</Button>
      </header>

      {/* Stats Grid */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All marketplace listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Products</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flaggedProducts}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </section>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
          <CardDescription>Search, filter, and manage marketplace products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search products, sellers, or categories..." className="pl-10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">Seller</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Stock</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Performance</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {product.id}</div>
                        </div>
                        {product.flagged && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{product.seller}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{product.category}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{product.price}</div>
                    </td>
                    <td className="p-4">
                      <div className={`font-medium ${product.stock === 0 ? "text-red-500" : ""}`}>
                        {product.stock} units
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          product.status === "active"
                            ? "secondary"
                            : product.status === "pending"
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {product.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Views:</span> {product.views}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Orders:</span> {product.orders}
                        </div>
                        {product.rating > 0 && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Rating:</span> {product.rating}⭐
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Product
                          </DropdownMenuItem>
                          {product.status === "pending" && (
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
