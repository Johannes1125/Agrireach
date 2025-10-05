"use client"

import { useState, useCallback } from "react"
import { authFetch } from "@/lib/auth-client"
import { toast } from "sonner"

export interface UploadedImage {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
}

interface UseImageUploadOptions {
  type: 'avatar' | 'product' | 'business' | 'community' | 'general'
  entityId?: string
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
  onUploadComplete?: (images: UploadedImage[]) => void
  onUploadStart?: () => void
  onUploadError?: (error: string) => void
}

export function useImageUpload(options: UseImageUploadOptions) {
  const {
    type,
    entityId,
    maxFiles = 1,
    maxSizeMB = 10,
    acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    onUploadComplete,
    onUploadStart,
    onUploadError
  } = options

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [images, setImages] = useState<UploadedImage[]>([])

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Maximum size: ${maxSizeMB}MB`
    }
    
    return null
  }, [acceptedTypes, maxSizeMB])

  const uploadFile = useCallback(async (file: File, index: number = 0): Promise<UploadedImage> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    if (entityId) formData.append('entityId', entityId)
    formData.append('imageIndex', index.toString())

    const response = await authFetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Upload failed')
    }

    const data = await response.json()
    return data.upload as UploadedImage
  }, [type, entityId])

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
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

      return uploadedImages

    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed'
      onUploadError?.(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [images, maxFiles, validateFile, uploadFile, onUploadComplete, onUploadStart, onUploadError])

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onUploadComplete?.(newImages)
  }, [images, onUploadComplete])

  const clearImages = useCallback(() => {
    setImages([])
    onUploadComplete?.([])
  }, [onUploadComplete])

  const deleteImage = useCallback(async (publicId: string) => {
    try {
      const response = await authFetch('/api/upload/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Delete failed')
      }

      // Remove from local state
      const newImages = images.filter(img => img.publicId !== publicId)
      setImages(newImages)
      onUploadComplete?.(newImages)
      toast.success('Image deleted successfully')

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete image'
      onUploadError?.(errorMessage)
      toast.error(errorMessage)
      throw error
    }
  }, [images, onUploadComplete, onUploadError])

  return {
    // State
    uploading,
    uploadProgress,
    images,
    
    // Actions
    uploadFiles,
    removeImage,
    clearImages,
    deleteImage,
    setImages,
    
    // Utilities
    validateFile,
    canUploadMore: images.length < maxFiles
  }
}
