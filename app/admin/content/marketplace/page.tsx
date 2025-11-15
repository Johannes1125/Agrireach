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
      {/* Stats Grid */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-200 dark:text-blue-300">Total Products</p>
                <p className="text-3xl font-bold text-blue-100 dark:text-blue-200">{(stats?.total || 0).toLocaleString()}</p>
                <p className="text-xs text-blue-200/80 dark:text-blue-300/80">All marketplace listings</p>
              </div>
              <div className="p-3 bg-blue-500/30 dark:bg-blue-500/20 rounded-lg border border-blue-400/30 dark:border-blue-400/20 shadow-lg flex-shrink-0">
                <Package className="h-8 w-8 text-blue-200 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-600 to-green-700 dark:from-green-700 dark:to-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-200 dark:text-green-300">Active Products</p>
                <p className="text-3xl font-bold text-green-100 dark:text-green-200">{(stats?.active || 0).toLocaleString()}</p>
                <p className="text-xs text-green-200/80 dark:text-green-300/80">Currently available</p>
              </div>
              <div className="p-3 bg-green-500/30 dark:bg-green-500/20 rounded-lg border border-green-400/30 dark:border-green-400/20 shadow-lg flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-200 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-200 dark:text-amber-300">Pending Review</p>
                <p className="text-3xl font-bold text-amber-100 dark:text-amber-200">{stats?.pending || 0}</p>
                <p className="text-xs text-amber-200/80 dark:text-amber-300/80">Awaiting approval</p>
              </div>
              <div className="p-3 bg-amber-500/30 dark:bg-amber-500/20 rounded-lg border border-amber-400/30 dark:border-amber-400/20 shadow-lg flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-amber-200 dark:text-amber-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-600 to-red-700 dark:from-red-700 dark:to-red-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-200 dark:text-red-300">Flagged Products</p>
                <p className="text-3xl font-bold text-red-100 dark:text-red-200">{stats?.flagged || 0}</p>
                <p className="text-xs text-red-200/80 dark:text-red-300/80">Need attention</p>
              </div>
              <div className="p-3 bg-red-500/30 dark:bg-red-500/20 rounded-lg border border-red-400/30 dark:border-red-400/20 shadow-lg flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-200 dark:text-red-300" />
              </div>
            </div>
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
