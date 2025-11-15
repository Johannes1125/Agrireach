"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { authFetch } from "@/lib/auth-client"
import { toast } from "sonner"
import { 
  Edit, 
  Trash2, 
  Eye, 
  AlertTriangle,
  Package,
  DollarSign,
  X,
  Sprout,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ManageProductModalProps {
  product: {
    _id: string
    title: string
    category: string
    price: number
    unit: string
    quantity_available: number
    status: string
    views: number
    images?: any
    organic: boolean
  }
  open: boolean
  onClose: () => void
  onEdit: (productId: string) => void
  onDelete: (productId: string) => void
}

export function ManageProductModal({ product, open, onClose, onEdit, onDelete }: ManageProductModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteProduct = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await authFetch(`/api/marketplace/products/${product._id}`, {
        method: "DELETE"
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to delete product")
      }

      toast.success("Product deleted successfully")
      setShowDeleteConfirm(false)
      onDelete(product._id)
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product")
    } finally {
      setIsDeleting(false)
    }
  }

  const imageUrl = product.images?.[0] || "/placeholder.svg"
  const isActive = product.status === "active"

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <DialogTitle className="text-2xl sm:text-3xl font-heading font-bold">
                  {product.title}
                </DialogTitle>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" className="text-sm">
                    {product.category}
                  </Badge>
                  <Badge 
                    variant={isActive ? "default" : "secondary"}
                    className={cn(
                      "text-sm font-medium",
                      isActive && "bg-green-500 hover:bg-green-600 text-white border-0"
                    )}
                  >
                    {isActive ? "Active" : product.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(product._id)}
                  className="border-2"
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteProduct}
                  className="border-2"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Product Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border-2 group">
              <img
                src={imageUrl}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {product.organic && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg">
                    <Sprout className="h-3 w-3 mr-1.5" />
                    Organic
                  </Badge>
                </div>
              )}
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-2">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Price</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-primary">
                    ₱{product.price?.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">per {product.unit}</p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Stock</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {product.quantity_available}
                  </p>
                  <p className="text-xs text-muted-foreground">{product.unit}</p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Views</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {product.views || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">total views</p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>Status</span>
                  </div>
                  <Badge 
                    variant={isActive ? "default" : "secondary"}
                    className={cn(
                      "text-xs font-medium mt-1",
                      isActive && "bg-green-500 hover:bg-green-600 text-white border-0"
                    )}
                  >
                    {isActive ? "Active" : product.status}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Organic Certification */}
            {product.organic && (
              <Card className="border-2 border-green-500/20 bg-green-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Sprout className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                          <Sprout className="h-3 w-3 mr-1" />
                          Organic Certified
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This product is certified organic and meets organic farming standards.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Link 
                href={`/marketplace/${product._id}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1"
              >
                <Button variant="outline" className="w-full border-2" size="lg">
                  <Eye className="h-4 w-4 mr-2" />
                  View Product Page
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onEdit(product._id)}
                className="flex-1 border-2"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span>Delete Product?</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{product.title}"</span>? This action cannot be undone.
            </p>
            <Card className="border-2 border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">
                      Warning: This action is permanent!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The product will be permanently removed from the marketplace and cannot be recovered.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 border-2"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Product
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
