"use client"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useMemo, useState } from "react"
import { useAdminMarketplace } from "@/hooks/use-admin-data"
import { authFetch } from "@/lib/auth-client"
import { toast } from "sonner"

export default function MarketplaceContentPage() {
  const { products, stats, loading } = useAdminMarketplace()
  const [searchQuery, setSearchQuery] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewProduct, setPreviewProduct] = useState<any | null>(null)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return products
    return products.filter((p: any) => (
      (p.title || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.seller_id?.full_name || "").toLowerCase().includes(q) ||
      String(p._id || "").toLowerCase().includes(q)
    ))
  }, [products, searchQuery])

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Marketplace Content</h1>
          <p className="text-muted-foreground mt-1">Manage products, listings, and marketplace content</p>
        </div>
        <Button className="self-start md:self-auto">Add Product</Button>
      </header>

      {/* Stats Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{(stats?.total || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All marketplace listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{(stats?.active || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Flagged Products</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats?.flagged || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </section>

      {/* Filters and Search merged into table card */}

      {/* Search + Products Table */}
      <Card>
        <CardContent className="p-0">
          {/* Top search/filter bar */}
          <div className="p-4 border-b bg-gradient-to-r from-muted/50 to-background sticky top-0 z-10">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products, sellers, or categories..." className="pl-10 rounded-full shadow-sm" />
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                  {(stats?.active || 0).toLocaleString()} active
                </span>
                <span className="px-2 py-1 rounded-full bg-muted/60 border text-xs">
                  {(stats?.total || 0).toLocaleString()} total
                </span>
                <Button variant="outline" size="sm" className="bg-transparent">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
              <Button variant="outline" size="sm" className="bg-transparent md:hidden">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="max-h-[560px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 border-b bg-muted/50 backdrop-blur supports-[backdrop-filter]:bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Seller</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Performance</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product: any) => (
                  <tr key={product._id || product.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.title} className="w-12 h-12 rounded-md object-cover ring-1 ring-border" />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{product.title}</div>
                          <div className="text-xs text-muted-foreground">ID: {product._id}</div>
                        </div>
                        {product.flagged && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{product.seller_id?.full_name || 'Unknown'}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {product.category}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">₱{product.price}/{product.unit}</div>
                    </td>
                    <td className="p-4">
                      <div className={`font-medium ${product.quantity_available === 0 ? "text-red-500" : ""}`}>
                        {product.quantity_available} units
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        className={
                          product.status === "active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : product.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }
                        variant="secondary"
                      >
                        {String(product.status).replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-muted/60">Views: {product.views}</span>
                        <span className="px-2 py-1 rounded-full bg-muted/60">Orders: {product.orders}</span>
                        {product.rating > 0 && (
                          <span className="px-2 py-1 rounded-full bg-muted/60">Rating: {product.rating}⭐</span>
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
                          <DropdownMenuItem onClick={() => { setPreviewProduct(product); setPreviewOpen(true); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {String(product.status).startsWith('pending') && (
                            <DropdownMenuItem onClick={async () => {
                              try {
                                const res = await authFetch(`/api/admin/marketplace/products/${product._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) })
                                if (!res.ok) throw new Error('Failed to approve')
                                toast.success('Approved')
                              } catch (e: any) { toast.error(e.message || 'Failed') }
                            }}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600" onClick={async () => {
                            try {
                              const res = await authFetch(`/api/admin/marketplace/products/${product._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove' }) })
                              if (!res.ok) throw new Error('Failed to remove')
                              toast.success('Removed')
                            } catch (e: any) { toast.error(e.message || 'Failed') }
                          }}>
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
          </div>
        </CardContent>
      </Card>
      {/* Product Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {previewProduct && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                {previewProduct.images?.[0] ? (
                  <img src={previewProduct.images[0]} alt={previewProduct.title} className="w-full h-40 object-cover rounded-md ring-1 ring-border" />
                ) : (
                  <div className="w-full h-40 bg-muted rounded-md flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{previewProduct.title}</h3>
                  <Badge
                    className={
                      previewProduct.status === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : previewProduct.status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    }
                    variant="secondary"
                  >
                    {String(previewProduct.status).replace("_", " ")}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">ID: {previewProduct._id}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Seller:</span> {previewProduct.seller_id?.full_name || 'Unknown'}</div>
                  <div><span className="text-muted-foreground">Category:</span> {previewProduct.category}</div>
                  <div><span className="text-muted-foreground">Price:</span> ₱{previewProduct.price}/{previewProduct.unit}</div>
                  <div><span className="text-muted-foreground">Stock:</span> {previewProduct.quantity_available} units</div>
                  <div><span className="text-muted-foreground">Views:</span> {previewProduct.views}</div>
                  <div><span className="text-muted-foreground">Orders:</span> {previewProduct.orders}</div>
                </div>
                {previewProduct.description && (
                  <p className="text-sm mt-2">{previewProduct.description}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
