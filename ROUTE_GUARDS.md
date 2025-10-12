# Route Guard Implementation

This document explains how route guards are implemented in AgriReach to prevent unauthorized URL navigation.

## Three-Layer Protection

### 1. Middleware (Edge Runtime)
**File:** `middleware.ts`

The first line of defense runs on Cloudflare's edge network before any page loads.

**What it does:**
- Validates JWT tokens from cookies
- Checks basic authentication requirements
- Enforces role-based route access
- Redirects unauthorized users instantly

**Protected Routes:**
- `/admin/*` - Admin only
- `/opportunities/post` - Recruiters only
- `/opportunities/edit/*` - Recruiters only
- `/marketplace/sell` - Buyers only
- `/marketplace/edit/*` - Buyers only
- `/dashboard`, `/profile`, `/settings` - Authenticated users only

### 2. Server Components (Server-Side)
**File:** `lib/server-auth.ts`

Server-side validation in page components ensures data security.

**Utilities:**
- `getCurrentUser()` - Get authenticated user
- `requireAuth()` - Require authentication
- `requireRole(role)` - Require specific role
- `requireAdmin()` - Require admin role
- `requireRecruiter()` - Require recruiter role
- `requireBuyer()` - Require buyer role
- `requireWorker()` - Require worker role

**Example Usage:**
```typescript
// In a Server Component
import { requireRecruiter } from "@/lib/server-auth"

export default async function PostJobPage() {
  // This will redirect if user is not a recruiter
  const user = await requireRecruiter()
  
  return <div>Post a job...</div>
}
```

### 3. Client Components (Client-Side)
**File:** `components/auth/route-guard.tsx`

Client-side guards provide user feedback and handle dynamic routes.

**Components:**
- `<RouteGuard>` - Wrap components that need protection
- `withRouteGuard()` - HOC for route guarding

**Example Usage:**
```typescript
// Wrap your page content
<RouteGuard requireAuth requiredRole="recruiter">
  <PostJobForm />
</RouteGuard>

// Or use as HOC
const ProtectedPage = withRouteGuard(MyPage, {
  requireAuth: true,
  requiredRole: "admin"
})
```

## Role Requirements

### Worker Role
- Can apply to jobs
- Cannot post jobs
- Cannot apply to their own jobs

### Recruiter Role
- Can post jobs
- Can edit their own jobs
- Cannot apply to jobs they posted

### Buyer Role
- Can sell products
- Can buy products
- Cannot buy their own products

### Admin Role
- Full access to admin panel
- Can manage users, content, and reports

## Dual-Role System

Users can have multiple roles (e.g., worker + buyer, recruiter + buyer).

**Example:**
- User with `["worker", "buyer"]` can:
  - Apply to jobs (as worker)
  - Buy products (as buyer)
  - Sell products (as buyer)
  - But cannot post jobs (no recruiter role)

## Redirect Flow

1. **Unauthenticated Access:**
   - User tries to access `/dashboard`
   - Middleware redirects to `/auth/login?redirect=/dashboard`
   - After login, user is redirected back to `/dashboard`

2. **Insufficient Permissions:**
   - User tries to access `/opportunities/post`
   - Middleware checks for recruiter role
   - If not found, redirects to `/opportunities`
   - Toast notification shows role requirement

3. **Authenticated but Wrong Role:**
   - User tries to access `/admin`
   - Middleware checks for admin role
   - If not admin, redirects to `/dashboard`

## Testing Route Guards

### Test Scenarios:

1. **Test Unauthenticated Access:**
   ```
   - Log out
   - Try to navigate to /dashboard
   - Should redirect to /auth/login
   ```

2. **Test Role Requirements:**
   ```
   - Log in as worker
   - Try to navigate to /opportunities/post
   - Should redirect to /opportunities
   ```

3. **Test Multiple Roles:**
   ```
   - Log in as worker + buyer
   - Can access /opportunities (apply)
   - Can access /marketplace/sell
   - Cannot access /opportunities/post
   ```

4. **Test URL Manipulation:**
   ```
   - Copy admin panel URL
   - Open in incognito mode
   - Should redirect to login
   ```

## Updating Role Requirements

To add role requirements to a new page:

1. **Add to middleware.ts:**
   ```typescript
   const MY_PROTECTED_ROUTES = ["/my-route"]
   ```

2. **Add server-side check:**
   ```typescript
   import { requireRole } from "@/lib/server-auth"
   
   export default async function MyPage() {
     await requireRole("my-role")
     return <div>Protected content</div>
   }
   ```

3. **Add client-side guard:**
   ```typescript
   <RouteGuard requiredRole="my-role">
     <MyComponent />
   </RouteGuard>
   ```

## Security Best Practices

1. **Never rely on client-side checks alone** - Always validate on server
2. **Use middleware for initial blocking** - Fastest protection
3. **Add server-side checks in components** - Protect data access
4. **Provide clear feedback** - Tell users why access was denied
5. **Log unauthorized attempts** - Monitor for security issues

## Common Issues

### Issue: "Redirect loop"
**Cause:** Redirect destination also requires same role
**Fix:** Ensure fallback URLs don't require the same permissions

### Issue: "Role not recognized"
**Cause:** User roles not updated in JWT
**Fix:** User needs to log out and log back in to refresh token

### Issue: "Can access via URL but not via navigation"
**Cause:** Client-side routing bypass
**Fix:** Ensure middleware patterns match all routes

## Performance Considerations

- Middleware runs on edge (very fast)
- JWT verification is synchronous (minimal overhead)
- Server components check once per page load
- Client guards check on route change only

## Monitoring

Track unauthorized access attempts:
```typescript
// In middleware.ts
console.log(`Unauthorized access attempt: ${pathname} by user ${user?.sub}`)
```

Consider adding analytics for:
- Failed access attempts
- Most commonly blocked routes
- Users with insufficient roles

