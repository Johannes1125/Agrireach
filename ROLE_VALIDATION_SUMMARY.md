# Dual-Role System Implementation Summary

## Overview
Implemented a comprehensive dual-role system that allows users to have multiple roles simultaneously. Users can now be, for example, both a worker and a buyer, or a recruiter and a seller.

## Key Features

### 1. Multiple Roles Support
- Users can have multiple roles: `worker`, `recruiter`, `buyer`, and `admin`
- The `roles` array field in the User model already existed and has been utilized
- Legacy `role` field is kept for backward compatibility

### 2. Role Validation

#### Server-Side Validation (`server/utils/role-validation.ts`)
Created utility functions to check user roles:
- `hasRole(userRoles, role)` - Check if user has a specific role
- `hasAnyRole(userRoles, roles)` - Check if user has any of the specified roles
- `hasAllRoles(userRoles, roles)` - Check if user has all specified roles
- `getRoleErrorMessage(role)` - Get user-friendly error messages

#### Client-Side Validation (`lib/role-utils.ts`)
Created helper functions for UI role checks:
- `userHasRole(user, role)` - Check if user has a role
- `userHasAnyRole(user, roles)` - Check for any role
- `userHasAllRoles(user, roles)` - Check for all roles
- `canApplyToJobs(user)` - Check if user can apply to jobs
- `canPostJobs(user)` - Check if user can post jobs
- `canBuySellProducts(user)` - Check if user can buy/sell
- `isResourceOwner(userId, resourceOwnerId)` - Check ownership
- `getUserRolesDisplay(user)` - Format roles for display
- `getAvailableActions(user)` - Get all available actions

### 3. API Endpoint Protections

#### Job Opportunities
**POST /api/opportunities** - Post a job
- ✅ Requires `recruiter` role
- ✅ Returns 403 with helpful message if user lacks role

**POST /api/opportunities/[id]/apply** - Apply to a job
- ✅ Requires `worker` role
- ✅ Prevents applying to own job postings
- ✅ Returns 403 with helpful message if user lacks role

#### Marketplace/Products
**POST /api/marketplace/products** - Create/sell a product
- ✅ Requires `buyer` role
- ✅ Returns 403 with helpful message if user lacks role

**POST /api/marketplace/orders** - Purchase a product
- ✅ Requires `buyer` role
- ✅ Prevents buying own products
- ✅ Returns 403 with helpful message if user lacks role

**POST /api/marketplace/checkout/create-payment** - Create payment
- ✅ Requires `buyer` role
- ✅ Returns 403 with helpful message if user lacks role

**POST /api/marketplace/checkout/confirm-payment** - Confirm payment
- ✅ Requires `buyer` role
- ✅ Returns 403 with helpful message if user lacks role

### 4. Role Management API

**Endpoint: `/api/users/[id]/roles`**

- **GET** - Get user's roles
  - Users can view their own roles
  - Admins can view any user's roles

- **PUT** - Update all roles at once
  - Users can update their own roles (except cannot self-assign admin)
  - Requires at least one role
  - Validates roles array

- **POST** - Add a single role
  - Adds a role to the user's roles array
  - Prevents duplicates
  - Cannot self-assign admin role

- **DELETE** - Remove a single role
  - Removes a role from the user's roles array
  - Ensures user always has at least one role

### 5. User Interface

#### Settings Page (Already Implemented)
The settings page (`components/settings/settings-content.tsx`) already has a **Multiple Roles** section where users can:
- ✅ Select/deselect roles with visual cards
- ✅ See icons and descriptions for each role:
  - **Worker**: Apply for jobs and find work opportunities
  - **Recruiter**: Post job listings and hire workers
  - **Buyer**: Buy and sell products on the marketplace
- ✅ Save changes with validation
- ✅ Automatic page reload after role update

### 6. Validation Rules

#### Self-Ownership Protection
- ✅ Users cannot apply to their own job postings
- ✅ Users cannot buy their own products
- ✅ Checked at both application and order creation

#### Role Requirements
- ✅ Workers: Can apply to jobs
- ✅ Recruiters: Can post jobs
- ✅ Buyers: Can buy AND sell products
- ✅ All validations check both `role` and `roles` fields

#### Admin Protection
- ✅ Users cannot self-assign admin role
- ✅ Only admins can assign/remove admin role from others

## Error Messages

All role validation errors return user-friendly messages:
- "Only workers can perform this action. Please update your profile to include the worker role."
- "Only recruiters can perform this action. Please update your profile to include the recruiter role."
- "Only buyers can perform this action. Please update your profile to include the buyer role."
- "You cannot apply to your own job posting"
- "Cannot order your own product"

## Implementation Files

### Server-Side
- `server/utils/role-validation.ts` - Role checking utilities
- `server/models/User.ts` - User model with roles array
- `app/api/users/[id]/roles/route.ts` - Role management endpoint
- `app/api/opportunities/route.ts` - Job posting with recruiter check
- `app/api/opportunities/[id]/apply/route.ts` - Job application with worker check
- `app/api/marketplace/products/route.ts` - Product creation with buyer check
- `app/api/marketplace/orders/route.ts` - Order creation with buyer check
- `app/api/marketplace/checkout/create-payment/route.ts` - Payment with buyer check
- `app/api/marketplace/checkout/confirm-payment/route.ts` - Confirmation with buyer check

### Client-Side
- `lib/role-utils.ts` - Client-side role utilities
- `components/settings/settings-content.tsx` - Role management UI (already existed)
- `app/settings/page.tsx` - Settings page with role data

## Usage Examples

### Server-Side
```typescript
import { hasRole, getRoleErrorMessage } from "@/server/utils/role-validation";

// Check if user has a role
const user = await User.findById(userId).select("roles role").lean();
const userRoles = user.roles || [user.role];

if (!hasRole(userRoles, "worker")) {
  return jsonError(getRoleErrorMessage("worker"), 403);
}
```

### Client-Side
```typescript
import { canApplyToJobs, canPostJobs, canBuySellProducts } from "@/lib/role-utils";

// Check user permissions
if (canApplyToJobs(user)) {
  // Show "Apply" button
}

if (canPostJobs(user)) {
  // Show "Post Job" button
}

if (canBuySellProducts(user)) {
  // Show marketplace features
}
```

## Testing Checklist

✅ User with worker role can apply to jobs
✅ User without worker role cannot apply to jobs
✅ User with recruiter role can post jobs
✅ User without recruiter role cannot post jobs
✅ User with buyer role can buy products
✅ User with buyer role can sell products
✅ User without buyer role cannot buy/sell
✅ Users cannot apply to their own jobs
✅ Users cannot buy their own products
✅ Users can have multiple roles simultaneously
✅ Users can update their roles via settings
✅ Users cannot self-assign admin role
✅ All error messages are user-friendly

## Benefits

1. **Flexibility**: Users can perform multiple activities without switching accounts
2. **Security**: Robust role-based access control on all critical endpoints
3. **User Experience**: Clear error messages guide users to update their roles
4. **Scalability**: Easy to add new roles or permissions in the future
5. **Backward Compatible**: Works with existing single-role users

