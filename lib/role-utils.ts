import { UserRole } from "@/server/models/User";

/**
 * Client-side utility to check if a user has a specific role
 */
export function userHasRole(user: any, role: UserRole): boolean {
  if (!user) return false;
  
  // Check roles array first (new system)
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.includes(role);
  }
  
  // Fallback to single role field (legacy)
  return user.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function userHasAnyRole(user: any, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.some(role => userHasRole(user, role));
}

/**
 * Check if user has all of the specified roles
 */
export function userHasAllRoles(user: any, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.every(role => userHasRole(user, role));
}

/**
 * Check if user can apply to jobs (must be a worker)
 */
export function canApplyToJobs(user: any): boolean {
  // Member (worker)
  return userHasRole(user, "worker");
}

/**
 * Check if user can post jobs (must be a recruiter)
 */
export function canPostJobs(user: any): boolean {
  // Employer (recruiter)
  return userHasRole(user, "recruiter");
}

/**
 * Check if user can buy/sell products (must be a buyer)
 */
export function canBuySellProducts(user: any): boolean {
  // Trader (buyer)
  return userHasRole(user, "buyer");
}

/**
 * Check if user is the owner of a resource
 */
export function isResourceOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

/**
 * Get user's roles as a string for display
 */
export function getUserRolesDisplay(user: any): string {
  if (!user) return "";
  
  const roles = user.roles && Array.isArray(user.roles) ? user.roles : [user.role];
  const roleMap: Record<string, string> = {
    admin: "Admin",
    worker: "Member",
    recruiter: "Employer",
    buyer: "Trader",
  };
  return roles.map((role: string) => roleMap[role] || (role?.charAt(0).toUpperCase() + role?.slice(1))).join(", ");
}

/**
 * Get display name for a single role key
 */
export function getRoleDisplay(roleKey: string): string {
  const roleMap: Record<string, string> = {
    admin: "Admin",
    worker: "Member",
    recruiter: "Employer",
    buyer: "Trader",
  };
  const key = String(roleKey || "").toLowerCase();
  return roleMap[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : "");
}

/**
 * Get available actions for a user based on their roles
 */
export function getAvailableActions(user: any): {
  canApplyToJobs: boolean;
  canPostJobs: boolean;
  canBuySellProducts: boolean;
  canAccessAdmin: boolean;
} {
  return {
    canApplyToJobs: canApplyToJobs(user),
    canPostJobs: canPostJobs(user),
    canBuySellProducts: canBuySellProducts(user),
    canAccessAdmin: userHasRole(user, "admin"),
  };
}

