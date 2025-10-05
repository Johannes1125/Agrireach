"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload, UploadedImage } from "@/components/ui/image-upload"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function UploadDemoPage() {
  const [avatarImages, setAvatarImages] = useState<UploadedImage[]>([])
  const [productImages, setProductImages] = useState<UploadedImage[]>([])
  const [businessImages, setBusinessImages] = useState<UploadedImage[]>([])
  const [communityImages, setCommunityImages] = useState<UploadedImage[]>([])

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Cloudinary Upload Demo</h1>
        <p className="text-muted-foreground">
          Test different types of image uploads with Cloudinary integration
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Avatar Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Avatar Upload</CardTitle>
            <p className="text-sm text-muted-foreground">
              Single image, optimized for profile pictures (400x400px)
            </p>
          </CardHeader>
          <CardContent>
            <ImageUpload
              type="avatar"
              maxFiles={1}
              maxSizeMB={5}
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              onUploadComplete={(images) => {
                setAvatarImages(images)
                toast.success("Avatar uploaded successfully!")
              }}
              onUploadError={(error) => {
                toast.error(`Avatar upload failed: ${error}`)
              }}
              existingImages={avatarImages}
            />
            {avatarImages.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Uploaded Avatar:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">URL: {avatarImages[0].url}</Badge>
                  <Badge variant="outline">Size: {avatarImages[0].width}x{avatarImages[0].height}</Badge>
                  <Badge variant="outline">Format: {avatarImages[0].format}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Images Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images Upload</CardTitle>
            <p className="text-sm text-muted-foreground">
              Multiple images (up to 5), optimized for marketplace products
            </p>
          </CardHeader>
          <CardContent>
            <ImageUpload
              type="product"
              entityId="demo-product-123"
              maxFiles={5}
              maxSizeMB={10}
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              onUploadComplete={(images) => {
                setProductImages(images)
                toast.success(`${images.length} product image(s) uploaded!`)
              }}
              onUploadError={(error) => {
                toast.error(`Product upload failed: ${error}`)
              }}
              existingImages={productImages}
            />
            {productImages.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Uploaded Product Images:</h4>
                <div className="space-y-1">
                  {productImages.map((img, index) => (
                    <div key={index} className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <Badge variant="outline">{img.width}x{img.height}</Badge>
                      <Badge variant="outline">{img.format}</Badge>
                      <Badge variant="outline">{(img.bytes / 1024).toFixed(1)} KB</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Business Logo Upload</CardTitle>
            <p className="text-sm text-muted-foreground">
              Single logo image, optimized for business branding (300x300px)
            </p>
          </CardHeader>
          <CardContent>
            <ImageUpload
              type="business"
              maxFiles={1}
              maxSizeMB={5}
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              onUploadComplete={(images) => {
                setBusinessImages(images)
                toast.success("Business logo uploaded successfully!")
              }}
              onUploadError={(error) => {
                toast.error(`Logo upload failed: ${error}`)
              }}
              existingImages={businessImages}
            />
            {businessImages.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Uploaded Logo:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Public ID: {businessImages[0].publicId}</Badge>
                  <Badge variant="outline">Size: {businessImages[0].width}x{businessImages[0].height}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Community Images Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Community Images Upload</CardTitle>
            <p className="text-sm text-muted-foreground">
              Multiple images (up to 3) for forum posts and discussions
            </p>
          </CardHeader>
          <CardContent>
            <ImageUpload
              type="community"
              entityId="demo-thread-456"
              maxFiles={3}
              maxSizeMB={10}
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              onUploadComplete={(images) => {
                setCommunityImages(images)
                toast.success(`${images.length} community image(s) uploaded!`)
              }}
              onUploadError={(error) => {
                toast.error(`Community upload failed: ${error}`)
              }}
              existingImages={communityImages}
            />
            {communityImages.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Uploaded Community Images:</h4>
                <div className="grid gap-2">
                  {communityImages.map((img, index) => (
                    <div key={index} className="p-2 border rounded text-xs space-y-1">
                      <div className="font-medium">Image {index + 1}</div>
                      <div>URL: <code className="text-xs bg-muted px-1 rounded">{img.url}</code></div>
                      <div>Dimensions: {img.width}x{img.height}</div>
                      <div>Size: {(img.bytes / 1024).toFixed(1)} KB</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{avatarImages.length}</div>
              <div className="text-sm text-muted-foreground">Avatar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{productImages.length}</div>
              <div className="text-sm text-muted-foreground">Product Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{businessImages.length}</div>
              <div className="text-sm text-muted-foreground">Business Logo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{communityImages.length}</div>
              <div className="text-sm text-muted-foreground">Community Images</div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <Button
              onClick={() => {
                setAvatarImages([])
                setProductImages([])
                setBusinessImages([])
                setCommunityImages([])
                toast.info("All uploads cleared")
              }}
              variant="outline"
              className="w-full"
            >
              Clear All Uploads
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
