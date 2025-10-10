"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Upload, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Dialog,
  DialogAction,
  DialogCancel,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { ImageUpload, UploadedImage } from "@/components/ui/image-upload"
import { authFetch } from "@/lib/auth-client"
import { useLoading } from "@/hooks/use-loading"
import { SlideTransition } from "@/components/ui/page-transition"

const categories = [
  "Vegetables",
  "Fruits",
  "Grains",
  "Seeds",
  "Fish & Seafood",
  "Dairy",
  "Crafts",
  "Livestock",
  "Herbs & Spices",
]

const units = ["kg", "liter", "piece", "dozen", "bundle", "bag", "box"]

export default function SellProductPage() {
  const { withLoading } = useLoading()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: undefined as string | undefined,
    price: "",
    unit: undefined as string | undefined,
    stockQuantity: "",
    location: "",
    features: [] as string[],
    images: [] as string[],
  })

  const [newFeature, setNewFeature] = useState("")
  const [isOrganic, setIsOrganic] = useState(false)
  const [isFreshHarvest, setIsFreshHarvest] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== feature),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirmDialog(true)
  }

  const handleConfirmedSubmit = async () => {
    setShowConfirmDialog(false)
    setIsSubmitting(true)

    await withLoading(async () => {
      try {
        const payload = {
          title: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category as string,
          price: Number(formData.price),
          unit: formData.unit as string,
          quantity_available: Number(formData.stockQuantity),
          location: formData.location.trim(),
          images: formData.images,
          organic: Boolean(isOrganic),
        }

        const res = await authFetch("/api/marketplace/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || "Failed to create product listing")
        }

        const data = await res.json()
        toast.success("Product listed successfully!")
        const productId = data?.data?.id || data?.id
        if (productId) {
          // Add delay to show loading for at least 5 seconds
          await new Promise(resolve => setTimeout(resolve, 3000))
          window.location.href = `/marketplace/${productId}`
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to create product listing")
      } finally {
        setIsSubmitting(false)
      }
    }, "Creating your product listing...")
  }

  return (
    <>
      <SlideTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/marketplace" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground font-sans mb-2">List Your Product</h1>
            <p className="text-muted-foreground">Share your products with the AgriReach community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="e.g., Organic Tomatoes"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your product, growing methods, quality, etc."
                    rows={4}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing and Stock */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => handleInputChange("stockQuantity", e.target.value)}
                      placeholder="Available quantity"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g., Nairobi, Kenya"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Features */}
            <Card>
              <CardHeader>
                <CardTitle>Product Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="organic"
                    checked={isOrganic}
                    onCheckedChange={(checked) => setIsOrganic(checked === true)}
                  />
                  <Label htmlFor="organic">Certified Organic</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fresh"
                    checked={isFreshHarvest}
                    onCheckedChange={(checked) => setIsFreshHarvest(checked === true)}
                  />
                  <Label htmlFor="fresh">Fresh Harvest</Label>
                </div>

                <div className="space-y-2">
                  <Label>Custom Features</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a feature (e.g., Pesticide-Free)"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {feature}
                          <button
                            type="button"
                            onClick={() => removeFeature(feature)}
                            className="ml-1 hover:text-destructive"
                            title={`Remove feature: ${feature}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <p className="text-sm text-muted-foreground">Add up to 5 high-quality images of your product</p>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  type="product"
                  maxFiles={5}
                  maxSizeMB={10}
                  acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                  onUploadComplete={(images) => {
                    const imageUrls = images.map(img => img.url)
                    setFormData({ ...formData, images: imageUrls })
                    toast.success(`${images.length} image(s) uploaded successfully`)
                  }}
                  onUploadError={(error) => {
                    toast.error(`Upload failed: ${error}`)
                  }}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <Button type="submit" className="w-full">
              List Product
            </Button>
          </form>
        </div>
      </div>
      </SlideTransition>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Product Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to list this product? Once published, it will be visible to all buyers on the
              marketplace and you'll start receiving orders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogCancel>Cancel</DialogCancel>
            <DialogAction onClick={handleConfirmedSubmit}>List Product</DialogAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
