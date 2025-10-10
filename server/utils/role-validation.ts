import { UserRole } from "../models/User";

/**
 * Check if a user has a specific role in their roles array
 * @param userRoles - Array of user roles
 * @param requiredRole - The role to check for
 * @returns true if user has the role, false otherwise
 */
export function hasRole(userRoles: UserRole[] | UserRole, requiredRole: UserRole): boolean {
  if (Array.isArray(userRoles)) {
    return userRoles.includes(requiredRole);
  }
  return userRoles === requiredRole;
}

/**
 * Check if a user has any of the specified roles
 * @param userRoles - Array of user roles
 * @param requiredRoles - Array of roles to check for
 * @returns true if user has at least one of the roles, false otherwise
 */
export function hasAnyRole(userRoles: UserRole[] | UserRole, requiredRoles: UserRole[]): boolean {
  if (Array.isArray(userRoles)) {
    return requiredRoles.some(role => userRoles.includes(role));
  }
  return requiredRoles.includes(userRoles);
}

/**
 * Check if a user has all of the specified roles
 * @param userRoles - Array of user roles
 * @param requiredRoles - Array of roles to check for
 * @returns true if user has all of the roles, false otherwise
 */
export function hasAllRoles(userRoles: UserRole[] | UserRole, requiredRoles: UserRole[]): boolean {
  if (Array.isArray(userRoles)) {
    return requiredRoles.every(role => userRoles.includes(role));
  }
  return requiredRoles.length === 1 && requiredRoles[0] === userRoles;
}

/**
 * Get error message for missing role
 */
export function getRoleErrorMessage(requiredRole: UserRole): string {
  const roleMessages: Record<UserRole, string> = {
    worker: "Only workers can perform this action. Please update your profile to include the worker role.",
    recruiter: "Only recruiters can perform this action. Please update your profile to include the recruiter role.",
    buyer: "Only buyers can perform this action. Please update your profile to include the buyer role.",
    admin: "Only administrators can perform this action."
  };
  return roleMessages[requiredRole] || "You don't have permission to perform this action.";
}

