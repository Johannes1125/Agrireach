"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-client"

declare global {
  interface Window {
    cloudinary?: any
  }
}

export interface UploadedImage {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
}

interface ImageUploadProps {
  type: 'avatar' | 'product' | 'business' | 'community' | 'general'
  entityId?: string
  imageIndex?: number
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
  onUploadComplete?: (images: UploadedImage[]) => void
  onUploadStart?: () => void
  onUploadError?: (error: string) => void
  className?: string
  disabled?: boolean
  existingImages?: UploadedImage[]
}

export function ImageUpload({
  type,
  entityId,
  imageIndex = 0,
  maxFiles = 1,
  maxSizeMB = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  onUploadComplete,
  onUploadStart,
  onUploadError,
  className = "",
  disabled = false,
  existingImages = []
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [images, setImages] = useState<UploadedImage[]>(existingImages)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Maximum size: ${maxSizeMB}MB`
    }
    
    return null
  }

  // Cloudinary Upload Widget integration
  const loadCloudinaryScript = () => {
    if (typeof window === 'undefined') return
    if (window.cloudinary) return
    const id = 'cloudinary-upload-widget'
    if (document.getElementById(id)) return
    const script = document.createElement('script')
    script.src = 'https://upload-widget.cloudinary.com/global/all.js'
    script.id = id
    script.async = true
    document.body.appendChild(script)
  }

  useEffect(() => {
    loadCloudinaryScript()
  }, [])

  const openCloudinaryWidget = () => {
    if (disabled) return
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if (!window.cloudinary || !cloudName || !uploadPreset) {
      const msg = "Cloudinary widget not configured"
      onUploadError?.(msg)
      toast.error(msg)
      return
    }

    const folderByType: Record<string, string> = {
      avatar: 'agrireach/avatars',
      product: 'agrireach/products',
      business: 'agrireach/business',
      community: 'agrireach/community',
      general: 'agrireach/general',
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        multiple: maxFiles > 1,
        maxFiles: maxFiles,
        folder: folderByType[type] || 'agrireach/general',
        sources: ['local', 'camera', 'url'],
        clientAllowedFormats: acceptedTypes.map(t => t.split('/')[1]).filter(Boolean),
        maxImageFileSize: maxSizeMB * 1024 * 1024,
        cropping: false,
        tags: [type, ...(entityId ? [entityId] : [])],
      },
      (error: any, result: any) => {
        if (error) {
          onUploadError?.(error.message || 'Upload failed')
          toast.error(error.message || 'Upload failed')
          setUploading(false)
          setUploadProgress(0)
          return
        }
        if (result?.event === 'queues-start') {
          setUploading(true)
          setUploadProgress(0)
          onUploadStart?.()
        }
        if (result?.event === 'upload-added') {
          // optional: could update UI
        }
        if (result?.event === 'upload-progress') {
          const bytes = result?.info?.bytes || 0
          const total = result?.info?.total_bytes || 0
          if (total > 0) setUploadProgress((bytes / total) * 100)
        }
        if (result?.event === 'success') {
          const info = result.info
          const uploaded: UploadedImage = {
            url: info.secure_url,
            publicId: info.public_id,
            width: info.width,
            height: info.height,
            format: info.format,
            bytes: info.bytes,
          }
          const newImages = [...images, uploaded]
          setImages(newImages)
          onUploadComplete?.(newImages)
        }
        if (result?.event === 'queues-end') {
          setUploading(false)
          setUploadProgress(100)
          toast.success('Upload completed')
          setTimeout(() => setUploadProgress(0), 500)
        }
      }
    )

    widget.open()
  }

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled || uploading) return

    const fileArray = Array.from(files)
    
    // Check if adding these files would exceed maxFiles
    if (images.length + fileArray.length > maxFiles) {
      const error = `Maximum ${maxFiles} file(s) allowed`
      onUploadError?.(error)
      toast.error(error)
      return
    }

    // Validate all files first
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        onUploadError?.(error)
        toast.error(error)
        return
      }
    }

    setUploading(true)
    setUploadProgress(0)
    onUploadStart?.()

    try {
      const uploadPromises = fileArray.map((file, index) => uploadFile(file, index))
      
      // Upload files with progress tracking
      const uploadedImages: UploadedImage[] = []
      for (let i = 0; i < uploadPromises.length; i++) {
        const uploadedImage = await uploadPromises[i]
        uploadedImages.push(uploadedImage)
        setUploadProgress(((i + 1) / uploadPromises.length) * 100)
      }

      const newImages = [...images, ...uploadedImages]
      setImages(newImages)
      onUploadComplete?.(newImages)
      toast.success(`${uploadedImages.length} file(s) uploaded successfully`)

    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed'
      onUploadError?.(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [images, maxFiles, disabled, uploading, type, entityId, imageIndex, onUploadComplete, onUploadStart, onUploadError])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onUploadComplete?.(newImages)
  }

  const openFileDialog = () => {
    openCloudinaryWidget()
  }

  const canUploadMore = images.length < maxFiles

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canUploadMore && (
        <Card 
          className={`border-2 border-dashed transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={!disabled ? openFileDialog : undefined}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            {uploading ? (
              <div className="space-y-4 w-full max-w-xs">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  Drop files here or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  {acceptedTypes.join(', ')} up to {maxSizeMB}MB
                </p>
                {maxFiles > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {images.length}/{maxFiles} files
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden File Input removed in favor of Cloudinary Upload Widget */}

      {/* Uploaded Images Preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative overflow-hidden rounded-md">
                  <img
                    src={image.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(index)
                      }}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {image.format.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {image.width}×{image.height}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(image.bytes / 1024).toFixed(1)} KB
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
