import { toast } from "sonner";
import { useRouter } from "next/navigation";

/**
 * Handles role validation errors and shows helpful notifications
 * with options to redirect to settings
 */
export function handleRoleValidationError(error: any, router?: any) {
  const errorMessage = error?.message || error?.error || "Access denied";
  
  // Check if it's a role validation error
  if (errorMessage.includes("role") && errorMessage.includes("Settings")) {
    toast.error("Role Required", {
      description: errorMessage,
      action: {
        label: "Update Roles",
        onClick: () => {
          if (router) {
            router.push("/settings");
          } else {
            window.location.href = "/settings";
          }
        }
      },
      duration: 8000, // Longer duration for important messages
    });
  } else {
    // Generic error handling
    toast.error("Access Denied", {
      description: errorMessage,
      duration: 5000,
    });
  }
}

/**
 * Hook for handling role validation errors with router
 */
export function useRoleValidationError() {
  const router = useRouter();
  
  return (error: any) => handleRoleValidationError(error, router);
}

/**
 * Shows a notification when user needs to update roles
 */
export function showRoleUpdateNotification(requiredRoles: string[], currentRoles?: string[]) {
  const roleText = requiredRoles.length === 1 ? requiredRoles[0] : requiredRoles.join(", ");
  
  toast.error("Role Update Required", {
    description: `You need ${roleText} role(s) to access this feature. Update your roles in Settings to continue.`,
    action: {
      label: "Go to Settings",
      onClick: () => {
        window.location.href = "/settings";
      }
    },
    duration: 10000, // Longer duration for important messages
  });
}

/**
 * Shows a success notification when roles are updated
 */
export function showRoleUpdateSuccess(updatedRoles: string[]) {
  const roleText = updatedRoles.length === 1 ? updatedRoles[0] : updatedRoles.join(", ");
  
  toast.success("Roles Updated", {
    description: `Your roles have been updated to: ${roleText}. You can now access all available features.`,
    duration: 5000,
  });
}
