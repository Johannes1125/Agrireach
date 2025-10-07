"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { authFetch } from "@/lib/auth-client"
import { toast } from "sonner"
import { 
  Edit, 
  Trash2, 
  Eye, 
  AlertTriangle,
  Package,
  DollarSign,
  MapPin
} from "lucide-react"

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

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{product.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.category}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(product._id)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteProduct}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Product Image */}
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-semibold flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  ₱{product.price} / {product.unit}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock</p>
                <p className="font-semibold flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {product.quantity_available} {product.unit}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={
                  product.status === "active" ? "default" :
                  product.status === "pending_approval" ? "secondary" :
                  "outline"
                }>
                  {product.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Views</p>
                <p className="font-semibold flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {product.views}
                </p>
              </div>
            </div>

            {product.organic && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  🌱 Organic
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This product is certified organic
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <a href={`/marketplace/${product._id}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Product Page
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Product?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{product.title}"</span>?
            </p>
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                The product will be permanently removed from the marketplace.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

