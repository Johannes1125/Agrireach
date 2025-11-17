/**
 * Custom Delivery Setup Utility
 * Replaces Lalamove integration with our own delivery system
 */

import { Order } from "@/server/models/Product";
import { Delivery } from "@/server/models/Delivery";
import { User } from "@/server/models/User";
import { Notification } from "@/server/models/Notification";

interface DeliverySetupResult {
  success: boolean;
  delivery_id?: string;
  tracking_number?: string;
  error?: string;
}

/**
 * Generate unique tracking number
 * Format: AGR-YYYYMMDD-XXXXX (e.g., AGR-20241117-A3B2C)
 */
function generateTrackingNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `AGR-${dateStr}-${randomStr}`;
}

/**
 * Create delivery record for an order
 * This replaces the Lalamove auto-setup functionality
 */
export async function createDeliveryForOrder(orderId: string): Promise<DeliverySetupResult> {
  try {
    // Find the order with populated user data AND product data
    const order = await Order.findById(orderId)
      .populate('seller_id', 'full_name phone location location_coordinates')
      .populate('buyer_id', 'full_name phone')
      .populate('product_id', 'location') // Populate product to get its location
      .lean();

    if (!order) {
      console.error(`[Delivery Setup] Order ${orderId} not found`);
      return { success: false, error: "Order not found" };
    }

    // Check if delivery already exists
    const existingDelivery = await Delivery.findOne({ order_id: orderId });
    if (existingDelivery) {
      console.log(`[Delivery Setup] Delivery already exists for order ${orderId}: ${existingDelivery._id}`);
      return { 
        success: true, 
        delivery_id: String(existingDelivery._id),
        tracking_number: existingDelivery.tracking_number,
      };
    }

    // Validate required data
    const seller = order.seller_id as any;
    const buyer = order.buyer_id as any;

    if (!seller || !buyer) {
      console.error(`[Delivery Setup] Missing seller or buyer data for order ${orderId}`);
      return { success: false, error: "Missing seller or buyer data" };
    }

    // Prepare pickup address - PRIORITIZE product location over seller location
    let pickupAddress = order.pickup_address;
    
    // Get product location (where the product actually is stored)
    const product = order.product_id as any;
    const productLocation = product?.location || null;
    
    // Determine the best location source: product location > seller location
    // Product location is more accurate since it's where the product is physically located
    const bestLocation = productLocation || seller.location;
    const bestLocationCoordinates = seller.location_coordinates; // Product doesn't store coordinates yet, use seller's
    
    // Validate and fix pickup address if needed
    if (pickupAddress) {
      // Ensure city is present - if missing, try to extract or use fallback
      if (!pickupAddress.city || pickupAddress.city.trim() === "") {
        if (bestLocation) {
          // Try to extract city from location string
          const locationParts = bestLocation.split(',');
          pickupAddress.city = locationParts[0]?.trim() || bestLocation || "Unknown";
        } else {
          pickupAddress.city = "Unknown";
        }
      }
      
      // Ensure line1 is present
      if (!pickupAddress.line1 || pickupAddress.line1.trim() === "") {
        pickupAddress.line1 = bestLocation || "Seller Location";
      }
    } else if (bestLocation) {
      // Create pickup address from product location (preferred) or seller location
      const locationParts = bestLocation.split(',');
      pickupAddress = {
        line1: bestLocation,
        city: locationParts[0]?.trim() || bestLocation || "Unknown",
        coordinates: bestLocationCoordinates || undefined,
      };
    }

    // Final validation - ensure city is never empty
    if (!pickupAddress || !pickupAddress.city || pickupAddress.city.trim() === "") {
      // Last resort: use best available location or default
      pickupAddress = {
        line1: bestLocation || "Seller Location",
        city: bestLocation ? bestLocation.split(',')[0]?.trim() || bestLocation : "Unknown",
        coordinates: bestLocationCoordinates || undefined,
      };
    }

    if (!pickupAddress || !pickupAddress.city || pickupAddress.city.trim() === "") {
      console.error(`[Delivery Setup] No pickup address for order ${orderId}`);
      console.error(`[Delivery Setup] Product location: ${productLocation}`);
      console.error(`[Delivery Setup] Seller location: ${seller.location}`);
      return { success: false, error: "Product or seller location is required for delivery" };
    }

    // Prepare delivery address (buyer location)
    const deliveryAddress = order.delivery_address_structured || {
      line1: order.delivery_address || "Delivery Address",
      city: "Unknown",
      state: "Unknown",
      postal_code: "",
      country: "Philippines",
    };

    // Generate tracking number
    let trackingNumber = generateTrackingNumber();
    // Ensure uniqueness
    let attempts = 0;
    while (await Delivery.findOne({ tracking_number: trackingNumber }) && attempts < 10) {
      trackingNumber = generateTrackingNumber();
      attempts++;
    }

    // Create delivery record
    const delivery = await Delivery.create({
      order_id: orderId,
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      pickup_address: pickupAddress,
      delivery_address: deliveryAddress,
      status: "pending", // Starts as pending until seller assigns driver
      tracking_number: trackingNumber,
    });

    // Update order with delivery_id
    await Order.findByIdAndUpdate(orderId, {
      $set: { delivery_id: delivery._id }
    });

    // Send notifications
    try {
      await Notification.create({
        user_id: order.buyer_id,
        type: 'order_update',
        title: 'Delivery Arranged',
        message: `Your order delivery has been arranged. Tracking number: ${trackingNumber}`,
        priority: 'high',
        action_url: `/marketplace/orders/${orderId}`,
      });

      await Notification.create({
        user_id: order.seller_id,
        type: 'order_update',
        title: 'Delivery Created',
        message: `Delivery record created for your order. Please assign a driver to proceed. Tracking: ${trackingNumber}`,
        priority: 'medium',
        action_url: `/marketplace/orders/${orderId}`,
      });
    } catch (notifError) {
      // Don't fail if notification fails
      console.error(`[Delivery Setup] Failed to send notifications:`, notifError);
    }

    console.log(`[Delivery Setup] Successfully created delivery for order ${orderId}: ${trackingNumber}`);

    return {
      success: true,
      delivery_id: String(delivery._id),
      tracking_number: trackingNumber,
    };
  } catch (error: any) {
    // Log error but don't throw - payment should still succeed
    console.error(`[Delivery Setup] Error creating delivery for order ${orderId}:`, error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

