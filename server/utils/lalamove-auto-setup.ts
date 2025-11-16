/**
 * DISABLED - Lalamove integration has been removed
 * This file is kept for reference but is no longer used.
 * Use server/utils/delivery-setup.ts instead for custom delivery system.
 */

// Export a stub function that returns an error to prevent import errors
export async function autoSetupLalamoveDelivery(orderId: string): Promise<{ success: false; error: string }> {
  console.warn(`[Lalamove Auto-Setup] Lalamove integration has been removed. Use custom delivery system instead.`);
  return { success: false, error: "Lalamove integration has been removed - using custom delivery system" };
}
