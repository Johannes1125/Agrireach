"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Upload, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImageUpload, UploadedImage } from "@/components/ui/image-upload";
import { LocationPicker, LocationData } from "@/components/ui/location-picker";
import { authFetch } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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
];

const units = ["kg", "liter", "piece", "dozen", "bundle", "bag", "box"];

interface EditProductFormProps {
  product: any;
}

export function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: product.title || "",
    description: product.description || "",
    category: product.category || undefined,
    price: product.price?.toString() || "",
    unit: product.unit || undefined,
    stockQuantity: product.quantity_available?.toString() || "",
    images: product.images || [],
  });

  // LocationPicker state (address + optional coordinates)
  const [productLocation, setProductLocation] = useState<LocationData>({
    address: product.location || "",
    coordinates:
      product.location_coordinates ??
      (product.locationCoordinates as any) ??
      (product.coordinates as any) ??
      undefined,
  });

  const [isOrganic, setIsOrganic] = useState(product.organic || false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category as string,
        price: Number(formData.price),
        unit: formData.unit as string,
        quantity_available: Number(formData.stockQuantity),
        location: (productLocation.address || "").trim(),
        location_coordinates: productLocation.coordinates,
        images: formData.images,
        organic: Boolean(isOrganic),
      };

      const res = await authFetch(`/api/marketplace/products/${product._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update product");
      }

      toast.success("Product updated successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Fresh Tomatoes"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your product, its quality, and any special features..."
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {/* LocationPicker replicates opportunities form with map + current location */}
                <LocationPicker
                  value={productLocation}
                  onChange={setProductLocation}
                  label="Location"
                  placeholder="Enter product location or use current location"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price (₱) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleInputChange("unit", value)}
                >
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

              <div>
                <Label htmlFor="stockQuantity">Available Quantity *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) =>
                    handleInputChange("stockQuantity", e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              type="product"
              maxFiles={5}
              maxSizeMB={10}
              acceptedTypes={[
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
              ]}
              existingImages={formData.images.map((url: string) => ({
                url,
                publicId: "existing",
                width: 0,
                height: 0,
                format: url.split(".").pop() || "jpg",
                bytes: 0,
              }))}
              onUploadComplete={(images: UploadedImage[]) => {
                const imageUrls = images.map((img) => img.url);
                setFormData((prev) => ({ ...prev, images: imageUrls }));
                toast.success(
                  `${images.length} image(s) uploaded successfully`
                );
              }}
              onUploadError={(err) => toast.error(err)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="organic"
                checked={isOrganic}
                onCheckedChange={(checked) => setIsOrganic(checked as boolean)}
              />
              <Label
                htmlFor="organic"
                className="text-sm font-normal cursor-pointer"
              >
                This product is organically grown/produced
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Updating..." : "Update Product"}
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Product Listing?</DialogTitle>
            <DialogDescription>
              Are you sure you want to update this product? The changes will be
              visible immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmedSubmit}>Confirm Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
