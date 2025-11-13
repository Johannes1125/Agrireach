import { v2 as cloudinary } from 'cloudinary'
import type { UploadApiResponse } from 'cloudinary'

// Configure Cloudinary - support either CLOUDINARY_URL or individual credentials
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL } as any);
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
  bytes: number
  created_at: string
}

export interface UploadOptions {
  folder?: string
  transformation?: any[]
  resource_type?: 'image' | 'video' | 'raw' | 'auto'
  public_id?: string
  overwrite?: boolean
  tags?: string[]
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    const uploadOptions = {
      folder: options.folder || 'agrireach',
      resource_type: options.resource_type || 'auto',
      transformation: options.transformation,
      public_id: options.public_id,
      overwrite: options.overwrite ?? true,
      tags: options.tags || ['agrireach'],
      ...options
    }

    let result: UploadApiResponse
    if (typeof file === 'string') {
      result = await cloudinary.uploader.upload(file, uploadOptions)
    } else {
      result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error || !result) {
            return reject(error)
          }
          resolve(result)
        })
        stream.end(file)
      })
    }
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      created_at: result.created_at
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload file to Cloudinary')
  }
}

/**
 * Upload profile avatar with optimizations
 */
export async function uploadProfileAvatar(
  file: Buffer | string,
  userId: string
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, {
    folder: 'agrireach/avatars',
    public_id: `avatar_${userId}`,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    tags: ['avatar', 'profile']
  })
}

/**
 * Upload marketplace product images
 */
export async function uploadProductImage(
  file: Buffer | string,
  productId: string,
  imageIndex: number = 0
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, {
    folder: 'agrireach/products',
    public_id: `product_${productId}_${imageIndex}`,
    transformation: [
      { width: 800, height: 600, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    tags: ['product', 'marketplace']
  })
}

/**
 * Upload business/company logos
 */
export async function uploadBusinessLogo(
  file: Buffer | string,
  userId: string
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, {
    folder: 'agrireach/business',
    public_id: `business_logo_${userId}`,
    transformation: [
      { width: 300, height: 300, crop: 'fit' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    tags: ['business', 'logo']
  })
}

/**
 * Upload community/forum images
 */
export async function uploadCommunityImage(
  file: Buffer | string,
  threadId: string,
  imageIndex: number = 0
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, {
    folder: 'agrireach/community',
    public_id: `community_${threadId}_${imageIndex}`,
    transformation: [
      { width: 600, height: 400, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    tags: ['community', 'forum']
  })
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete file from Cloudinary')
  }
}

/**
 * Generate optimized image URL with transformations
 */
export function generateImageUrl(
  publicId: string,
  transformations?: any[]
): string {
  if (!transformations) {
    return cloudinary.url(publicId, { secure: true })
  }
  
  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformations
  })
}

/**
 * Get image info from Cloudinary
 */
export async function getImageInfo(publicId: string) {
  try {
    const result = await cloudinary.api.resource(publicId)
    return result
  } catch (error) {
    console.error('Cloudinary get image info error:', error)
    throw new Error('Failed to get image info from Cloudinary')
  }
}

export { cloudinary }
