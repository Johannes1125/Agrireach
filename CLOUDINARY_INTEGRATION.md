# Cloudinary Integration for AgriReach

This document explains how to use the Cloudinary integration for file uploads in the AgriReach application.

## Overview

The Cloudinary integration provides:
- **Secure file uploads** with authentication
- **Automatic image optimization** (compression, format conversion)
- **Multiple upload types** (avatar, product, business, community)
- **Drag & drop interface** with progress tracking
- **File validation** (type, size, count limits)
- **Image transformations** (resizing, cropping, quality optimization)

## Setup

### 1. Environment Variables

Add your Cloudinary URL to `.env`:

```env
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### 2. Dependencies

The integration uses the `cloudinary` package:

```bash
npm install cloudinary
```

## Usage

### Basic Image Upload Component

```tsx
import { ImageUpload } from "@/components/ui/image-upload"

function MyComponent() {
  return (
    <ImageUpload
      type="avatar"
      maxFiles={1}
      maxSizeMB={5}
      onUploadComplete={(images) => {
        console.log("Uploaded:", images)
      }}
      onUploadError={(error) => {
        console.error("Upload failed:", error)
      }}
    />
  )
}
```

### Using the Hook

```tsx
import { useImageUpload } from "@/hooks/use-image-upload"

function MyComponent() {
  const {
    uploading,
    uploadProgress,
    images,
    uploadFiles,
    removeImage,
    clearImages
  } = useImageUpload({
    type: "product",
    entityId: "product-123",
    maxFiles: 5,
    onUploadComplete: (images) => {
      // Handle successful upload
    }
  })

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />
      {uploading && <div>Progress: {uploadProgress}%</div>}
      {images.map((img, index) => (
        <div key={index}>
          <img src={img.url} alt={`Upload ${index}`} />
          <button onClick={() => removeImage(index)}>Remove</button>
        </div>
      ))}
    </div>
  )
}
```

## Upload Types

### 1. Avatar Upload
- **Type**: `avatar`
- **Max Files**: 1
- **Transformations**: 400x400px, face-centered crop
- **Folder**: `agrireach/avatars`
- **Use Case**: User profile pictures

### 2. Product Images
- **Type**: `product`
- **Max Files**: 5
- **Transformations**: 800x600px, fill crop
- **Folder**: `agrireach/products`
- **Use Case**: Marketplace product photos

### 3. Business Logo
- **Type**: `business`
- **Max Files**: 1
- **Transformations**: 300x300px, fit crop
- **Folder**: `agrireach/business`
- **Use Case**: Company logos and branding

### 4. Community Images
- **Type**: `community`
- **Max Files**: 3
- **Transformations**: 600x400px, limit crop
- **Folder**: `agrireach/community`
- **Use Case**: Forum posts and discussions

### 5. General Upload
- **Type**: `general`
- **Max Files**: Configurable
- **Transformations**: None (original)
- **Folder**: `agrireach/general`
- **Use Case**: Any other images

## API Endpoints

### Upload Image
```
POST /api/upload
Content-Type: multipart/form-data

Body:
- file: File
- type: string (avatar|product|business|community|general)
- entityId?: string (optional, for products/community)
- imageIndex?: number (optional, for multiple images)
```

### Delete Image
```
DELETE /api/upload/delete
Content-Type: application/json

Body:
{
  "publicId": "string"
}
```

## File Validation

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### Size Limits
- **Avatar**: 5MB max
- **Product**: 10MB max
- **Business**: 5MB max
- **Community**: 10MB max
- **General**: 10MB max

### Count Limits
- **Avatar**: 1 image
- **Product**: 5 images
- **Business**: 1 image
- **Community**: 3 images
- **General**: Configurable

## Image Transformations

All images are automatically optimized with:
- **Quality**: Auto (Cloudinary chooses best quality/size ratio)
- **Format**: Auto (Cloudinary chooses best format for browser)
- **Compression**: Automatic lossless/lossy compression

### Specific Transformations

#### Avatar
```javascript
{
  width: 400,
  height: 400,
  crop: 'fill',
  gravity: 'face'  // Centers on detected faces
}
```

#### Product Images
```javascript
{
  width: 800,
  height: 600,
  crop: 'fill'  // Fills entire area, may crop
}
```

#### Business Logo
```javascript
{
  width: 300,
  height: 300,
  crop: 'fit'  // Fits within bounds, maintains aspect ratio
}
```

#### Community Images
```javascript
{
  width: 600,
  height: 400,
  crop: 'limit'  // Only resizes if larger than specified
}
```

## Integration Examples

### Profile Settings
```tsx
// In components/settings/settings-content.tsx
<ImageUpload
  type="avatar"
  maxFiles={1}
  maxSizeMB={5}
  onUploadComplete={(images) => {
    setFormData({ ...formData, avatar: images[0].url })
  }}
/>
```

### Marketplace Product Listing
```tsx
// In app/marketplace/sell/page.tsx
<ImageUpload
  type="product"
  maxFiles={5}
  maxSizeMB={10}
  onUploadComplete={(images) => {
    const imageUrls = images.map(img => img.url)
    setFormData({ ...formData, images: imageUrls })
  }}
/>
```

### Community Forum
```tsx
// In app/community/new-thread/page.tsx
<ImageUpload
  type="community"
  entityId={threadId}
  maxFiles={3}
  maxSizeMB={10}
  onUploadComplete={(images) => {
    const imageUrls = images.map(img => img.url)
    setFormData({ ...formData, images: imageUrls })
  }}
/>
```

### Business Profile
```tsx
// In components/settings/settings-content.tsx
<ImageUpload
  type="business"
  maxFiles={1}
  maxSizeMB={5}
  onUploadComplete={(images) => {
    setFormData({
      ...formData,
      business: { ...formData.business, logo: images[0].url }
    })
  }}
/>
```

## Security Features

1. **Authentication Required**: All uploads require valid JWT token
2. **File Type Validation**: Only allowed image formats accepted
3. **Size Limits**: Configurable maximum file sizes
4. **Rate Limiting**: Built-in protection against abuse
5. **Secure URLs**: All images served over HTTPS
6. **Access Control**: Images organized by user and type

## Error Handling

The integration provides comprehensive error handling:

- **File too large**: Clear message with size limit
- **Invalid file type**: List of accepted formats
- **Upload failed**: Network or server errors
- **Authentication errors**: Redirect to login
- **Quota exceeded**: Cloudinary account limits

## Testing

Visit `/demo/upload` to test all upload types and see the integration in action.

## Troubleshooting

### Common Issues

1. **"Upload failed" error**
   - Check Cloudinary URL in environment variables
   - Verify internet connection
   - Check file size and type

2. **"Authentication required" error**
   - Ensure user is logged in
   - Check JWT token validity

3. **Images not displaying**
   - Verify Cloudinary URL format
   - Check browser console for CORS errors
   - Ensure images are public

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will log detailed upload information to the console.
