/**
 * Utility functions for working with Cloudinary images
 */

export interface ImageTransformation {
  width?: number
  height?: number
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'crop'
  gravity?: 'face' | 'center' | 'north' | 'south' | 'east' | 'west'
  quality?: 'auto' | number
  format?: 'auto' | 'jpg' | 'png' | 'webp'
  radius?: number | 'max'
  effect?: string
  overlay?: string
}

/**
 * Generate optimized Cloudinary URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  transformations: ImageTransformation = {}
): string {
  if (!publicId) return ''
  
  // If it's already a full URL, return as-is
  if (publicId.startsWith('http')) return publicId
  
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dtkywpyvv'
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`
  
  // Build transformation string
  const transformParts: string[] = []
  
  if (transformations.width) transformParts.push(`w_${transformations.width}`)
  if (transformations.height) transformParts.push(`h_${transformations.height}`)
  if (transformations.crop) transformParts.push(`c_${transformations.crop}`)
  if (transformations.gravity) transformParts.push(`g_${transformations.gravity}`)
  if (transformations.quality) transformParts.push(`q_${transformations.quality}`)
  if (transformations.format) transformParts.push(`f_${transformations.format}`)
  if (transformations.radius) transformParts.push(`r_${transformations.radius}`)
  if (transformations.effect) transformParts.push(`e_${transformations.effect}`)
  if (transformations.overlay) transformParts.push(`l_${transformations.overlay}`)
  
  const transformString = transformParts.length > 0 ? transformParts.join(',') + '/' : ''
  
  return `${baseUrl}/${transformString}${publicId}`
}

/**
 * Get avatar image with standard transformations
 */
export function getAvatarUrl(publicId: string, size: number = 400): string {
  return getOptimizedImageUrl(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    format: 'auto'
  })
}

/**
 * Get product image with standard transformations
 */
export function getProductImageUrl(
  publicId: string, 
  width: number = 800, 
  height: number = 600
): string {
  return getOptimizedImageUrl(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  })
}

/**
 * Get business logo with standard transformations
 */
export function getBusinessLogoUrl(publicId: string, size: number = 300): string {
  return getOptimizedImageUrl(publicId, {
    width: size,
    height: size,
    crop: 'fit',
    quality: 'auto',
    format: 'auto'
  })
}

/**
 * Get community image with standard transformations
 */
export function getCommunityImageUrl(
  publicId: string,
  width: number = 600,
  height: number = 400
): string {
  return getOptimizedImageUrl(publicId, {
    width,
    height,
    crop: 'limit',
    quality: 'auto',
    format: 'auto'
  })
}

/**
 * Get thumbnail version of any image
 */
export function getThumbnailUrl(
  publicId: string,
  size: number = 150
): string {
  return getOptimizedImageUrl(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  })
}

/**
 * Get blurred placeholder version of image
 */
export function getPlaceholderUrl(publicId: string): string {
  return getOptimizedImageUrl(publicId, {
    width: 50,
    height: 50,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
    effect: 'blur:1000'
  })
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(url: string): string {
  if (!url) return ''
  
  // If it's already a public ID, return as-is
  if (!url.startsWith('http')) return url
  
  try {
    const urlParts = url.split('/')
    const uploadIndex = urlParts.findIndex(part => part === 'upload')
    
    if (uploadIndex === -1) return ''
    
    // Get everything after 'upload' and any transformations
    const afterUpload = urlParts.slice(uploadIndex + 1)
    
    // Remove transformation parameters (they contain commas or start with specific prefixes)
    const publicIdParts = afterUpload.filter(part => 
      !part.includes(',') && 
      !part.startsWith('w_') && 
      !part.startsWith('h_') && 
      !part.startsWith('c_') &&
      !part.startsWith('q_') &&
      !part.startsWith('f_')
    )
    
    // Join remaining parts and remove file extension
    const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '')
    
    return publicId
  } catch (error) {
    console.error('Error extracting public ID from URL:', error)
    return ''
  }
}

/**
 * Check if URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com') || url.includes('cloudinary.com')
}

/**
 * Get responsive image URLs for different screen sizes
 */
export function getResponsiveImageUrls(publicId: string) {
  return {
    mobile: getOptimizedImageUrl(publicId, { width: 400, quality: 'auto', format: 'auto' }),
    tablet: getOptimizedImageUrl(publicId, { width: 800, quality: 'auto', format: 'auto' }),
    desktop: getOptimizedImageUrl(publicId, { width: 1200, quality: 'auto', format: 'auto' }),
    large: getOptimizedImageUrl(publicId, { width: 1600, quality: 'auto', format: 'auto' })
  }
}
