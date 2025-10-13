/**
 * Edge-compatible JWT utilities for middleware
 * Uses only Web Crypto API available in Edge Runtime
 */

interface JwtPayload {
  sub: string // user id
  role: string
  roles?: string[]
  kind: string
  iat?: number
  exp?: number
}

/**
 * Decode JWT without verification (for middleware use only)
 * This is safe for authorization checks because we verify tokens server-side
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    // Decode the payload (second part)
    const payload = parts[1]
    
    // Handle base64url decoding properly
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    const decoded = JSON.parse(atob(padded));
    
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }
    
    return decoded as JwtPayload
  } catch {
    return null
  }
}

/**
 * Get user roles from JWT payload
 */
export function getRolesFromPayload(payload: JwtPayload): string[] {
  // Prioritize roles array if available
  if (payload.roles && Array.isArray(payload.roles)) {
    return payload.roles;
  }
  // Fallback to single role field
  return payload.role ? [payload.role] : [];
}

