/**
 * Automatic Lalamove Delivery Setup
 * This utility automatically arranges Lalamove delivery after order creation
 * It handles errors gracefully and never fails the payment process
 */

import { Order } from "@/server/models/Product";
import { User } from "@/server/models/User";
import { Notification } from "@/server/models/Notification";
import { getQuotation, placeOrder, LalamoveQuotationRequest, LalamovePlaceOrderRequest, LalamoveError } from "@/lib/lalamove";
import { geocodeAddress } from "@/server/utils/geocoding";

interface AutoSetupResult {
  success: boolean;
  lalamove_order_id?: string;
  tracking_url?: string;
  error?: string;
}

/**
 * Automatically set up Lalamove delivery for an order
 * This function never throws - it always returns a result
 */
export async function autoSetupLalamoveDelivery(orderId: string): Promise<AutoSetupResult> {
  try {
    // Find the order with populated user data
    const order = await Order.findById(orderId)
      .populate('seller_id', 'full_name phone location location_coordinates')
      .populate('buyer_id', 'full_name phone')
      .lean();

    if (!order) {
      console.error(`[Lalamove Auto-Setup] Order ${orderId} not found`);
      return { success: false, error: "Order not found" };
    }

    // Check if order already has Lalamove delivery
    if (order.lalamove_order_id) {
      console.log(`[Lalamove Auto-Setup] Order ${orderId} already has Lalamove delivery: ${order.lalamove_order_id}`);
      return { 
        success: true, 
        lalamove_order_id: order.lalamove_order_id,
        tracking_url: order.lalamove_tracking_url 
      };
    }

    // Validate required data
    let seller = order.seller_id as any;
    let buyer = order.buyer_id as any;

    if (!seller || !buyer) {
      console.error(`[Lalamove Auto-Setup] Missing seller or buyer data for order ${orderId}`);
      return { success: false, error: "Missing seller or buyer data" };
    }

    // Re-fetch seller to ensure we have latest location data (in case it was updated after order creation)
    if (!seller.location && !order.pickup_address) {
      console.log(`[Lalamove Auto-Setup] Re-fetching seller data for order ${orderId} to get location`);
      const { User } = await import("@/server/models/User");
      const freshSeller = await User.findById(seller._id || seller).select('full_name phone location location_coordinates').lean();
      if (freshSeller) {
        seller = freshSeller;
      }
    }

    // Check for pickup address - use seller location as pickup (seller's location = pickup point)
    if (!order.pickup_address && !seller.location) {
      console.error(`[Lalamove Auto-Setup] No pickup address for order ${orderId}`);
      console.error(`[Lalamove Auto-Setup] Order pickup_address: ${JSON.stringify(order.pickup_address)}`);
      console.error(`[Lalamove Auto-Setup] Seller location: ${seller.location}`);
      console.error(`[Lalamove Auto-Setup] Seller ID: ${seller._id || seller}`);
      return { success: false, error: "No pickup address available. Seller location is required." };
    }

    // Check for delivery address
    if (!order.delivery_address_structured && !order.delivery_address) {
      console.error(`[Lalamove Auto-Setup] No delivery address for order ${orderId}`);
      return { success: false, error: "No delivery address available" };
    }

    // Check for phone numbers (required by Lalamove)
    if (!seller.phone || !buyer.phone) {
      console.error(`[Lalamove Auto-Setup] Missing phone numbers for order ${orderId}. Seller: ${!!seller.phone}, Buyer: ${!!buyer.phone}`);
      return { success: false, error: "Seller or buyer phone number missing" };
    }

    // Prepare pickup address (seller's location = pickup point)
    let pickupAddress: string;
    let pickupCoordinates: { latitude: number; longitude: number } | null = null;

    // Priority: order.pickup_address > seller.location
    if (order.pickup_address && order.pickup_address.line1) {
      pickupAddress = order.pickup_address.line1;
      if (order.pickup_address.coordinates) {
        pickupCoordinates = order.pickup_address.coordinates;
      } else if (seller.location_coordinates) {
        pickupCoordinates = seller.location_coordinates;
      }
    } else if (seller.location) {
      // Use seller's location as pickup address
      pickupAddress = seller.location;
      if (seller.location_coordinates) {
        pickupCoordinates = seller.location_coordinates;
      }
    } else {
      // This shouldn't happen due to check above, but just in case
      console.error(`[Lalamove Auto-Setup] Cannot determine pickup address for order ${orderId}`);
      return { success: false, error: "Cannot determine pickup address" };
    }

    if (!pickupAddress || pickupAddress.trim() === "") {
      console.error(`[Lalamove Auto-Setup] Pickup address is empty for order ${orderId}`);
      return { success: false, error: "Pickup address is empty" };
    }

    // Prepare delivery address (buyer's delivery address = drop-off point)
    let deliveryAddress: string;
    let deliveryCoordinates: { latitude: number; longitude: number } | null = null;

    // Priority: coordinates from delivery_address_structured > geocoding
    if (order.delivery_address_structured?.coordinates) {
      // Use coordinates directly from delivery_address_structured (from location buttons)
      deliveryCoordinates = order.delivery_address_structured.coordinates;
      deliveryAddress = order.delivery_address_structured.line1 || "Location selected";
      console.log(`[Lalamove Auto-Setup] Using coordinates from delivery_address_structured`);
    } else if (order.delivery_address_structured) {
      const addr = order.delivery_address_structured;
      // Build address string from structured data
      const parts = [
        addr.line1,
        addr.line2,
        addr.city,
        addr.state,
        addr.postal_code,
        addr.country || "Philippines"
      ].filter(Boolean);
      deliveryAddress = parts.join(", ");
      
      if (addr.coordinates) {
        deliveryCoordinates = addr.coordinates;
      }
    } else if (order.delivery_address) {
      deliveryAddress = order.delivery_address;
    } else {
      console.error(`[Lalamove Auto-Setup] Cannot determine delivery address for order ${orderId}`);
      return { success: false, error: "Cannot determine delivery address" };
    }

    // Geocode pickup address if coordinates are missing
    if (!pickupCoordinates && pickupAddress) {
      console.log(`[Lalamove Auto-Setup] Geocoding pickup address: ${pickupAddress}`);
      const geocodeResult = await geocodeAddress(pickupAddress);
      if (geocodeResult?.coordinates) {
        pickupCoordinates = geocodeResult.coordinates;
      } else {
        console.error(`[Lalamove Auto-Setup] Failed to geocode pickup address: ${pickupAddress}`);
        return { success: false, error: "Could not geocode pickup address" };
      }
    }

    // Geocode delivery address ONLY if coordinates are missing (shouldn't happen with new flow)
    if (!deliveryCoordinates && deliveryAddress) {
      console.log(`[Lalamove Auto-Setup] Geocoding delivery address: ${deliveryAddress}`);
      const geocodeResult = await geocodeAddress(deliveryAddress);
      if (geocodeResult?.coordinates) {
        deliveryCoordinates = geocodeResult.coordinates;
      } else {
        console.error(`[Lalamove Auto-Setup] Failed to geocode delivery address: ${deliveryAddress}`);
        return { success: false, error: "Could not geocode delivery address. Please use location buttons to select delivery address." };
      }
    }

    // Coordinates are now required
    if (!deliveryCoordinates) {
      console.error(`[Lalamove Auto-Setup] No delivery coordinates for order ${orderId}. Coordinates are required.`);
      return { success: false, error: "Delivery coordinates are required. Please use location buttons to select delivery address." };
    }

    if (!pickupCoordinates) {
      console.error(`[Lalamove Auto-Setup] Missing pickup coordinates for order ${orderId}`);
      return { success: false, error: "Missing pickup coordinates" };
    }

    // Step 1: Get Lalamove quotation
    console.log(`[Lalamove Auto-Setup] Getting quotation for order ${orderId}`);
    const quotationRequest: LalamoveQuotationRequest = {
      serviceType: "MOTORCYCLE", // Default to motorcycle, can be made configurable
      language: 'en',
      stops: [
        {
          coordinates: {
            lat: pickupCoordinates.latitude.toString(),
            lng: pickupCoordinates.longitude.toString(),
          },
          address: pickupAddress,
        },
        {
          coordinates: {
            lat: deliveryCoordinates.latitude.toString(),
            lng: deliveryCoordinates.longitude.toString(),
          },
          address: deliveryAddress,
        },
      ],
      item: {
        quantity: String(order.quantity || 1),
        weight: "1", // Default weight, can be enhanced with product weight
      },
    };

    const quotation = await getQuotation(quotationRequest);
    const quotationId = quotation.data.quotationId;

    if (!quotationId) {
      console.error(`[Lalamove Auto-Setup] No quotation ID returned for order ${orderId}`);
      return { success: false, error: "Failed to get quotation" };
    }

    console.log(`[Lalamove Auto-Setup] Quotation received: ${quotationId} for order ${orderId}`);

    // Step 2: Get quotation details to extract stopIds
    // According to Lalamove API docs, we need to use stopId from quotation response
    const { getQuotationDetails } = await import("@/lib/lalamove");
    let quotationDetails;
    try {
      quotationDetails = await getQuotationDetails(quotationId);
    } catch (err) {
      console.error(`[Lalamove Auto-Setup] Error getting quotation details for order ${orderId}:`, err);
      quotationDetails = null;
    }

    // Extract stopIds from quotation (first stop is pickup, rest are delivery)
    const quotationStops = quotationDetails?.data?.stops || [];
    const pickupStopId = quotationStops[0]?.stopId || "1";
    const deliveryStopId = quotationStops[1]?.stopId || "2";

    // Step 3: Place Lalamove order
    // According to Lalamove API docs: https://developers.lalamove.com/#place-order
    console.log(`[Lalamove Auto-Setup] Placing Lalamove order for order ${orderId}`);
    const placeOrderRequest: LalamovePlaceOrderRequest = {
      quotationId,
      sender: {
        stopId: pickupStopId, // Use stopId from quotation
        name: seller.full_name || "Seller",
        phone: seller.phone,
      },
      recipients: [
        {
          stopId: deliveryStopId, // Use stopId from quotation
          name: buyer.full_name || "Buyer",
          phone: buyer.phone,
        },
      ],
      isPODEnabled: true, // Enable Proof of Delivery for better tracking
      metadata: {
        order_id: String(order._id),
        buyer_id: String(order.buyer_id),
        seller_id: String(order.seller_id),
        product_id: String(order.product_id),
      },
    };

    const lalamoveOrder = await placeOrder(placeOrderRequest);
    const lalamoveOrderId = lalamoveOrder.data.orderId;
    const trackingUrl = lalamoveOrder.data.shareLink;
    const driverId = lalamoveOrder.data.driverId;

    // Step 3: Update order with Lalamove information
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        lalamove_order_id: lalamoveOrderId,
        lalamove_quotation_id: quotationId,
        lalamove_status: lalamoveOrder.data.status,
        lalamove_tracking_url: trackingUrl,
        lalamove_driver_id: driverId,
        status: driverId ? "shipped" : "confirmed",
      },
    });

    // Step 4: Send notifications
    try {
      await Notification.create({
        user_id: order.buyer_id,
        type: 'order_update',
        title: 'Delivery Arranged',
        message: `Your order has been arranged for delivery via Lalamove. Track your order: ${trackingUrl || 'N/A'}`,
        priority: 'high',
        action_url: `/marketplace/orders/${orderId}`,
      });

      await Notification.create({
        user_id: order.seller_id,
        type: 'order_update',
        title: 'Delivery Arranged',
        message: `Lalamove delivery has been automatically arranged for your order. Tracking: ${trackingUrl || 'N/A'}`,
        priority: 'medium',
        action_url: `/marketplace/orders/${orderId}`,
      });
    } catch (notifError) {
      // Don't fail if notification fails
      console.error(`[Lalamove Auto-Setup] Failed to send notifications:`, notifError);
    }

    console.log(`[Lalamove Auto-Setup] Successfully set up Lalamove delivery for order ${orderId}: ${lalamoveOrderId}`);

    return {
      success: true,
      lalamove_order_id: lalamoveOrderId,
      tracking_url: trackingUrl,
    };
  } catch (error: any) {
    // Log error but don't throw - payment should still succeed
    console.error(`[Lalamove Auto-Setup] Error setting up delivery for order ${orderId}:`, error);
    
    if (error instanceof LalamoveError) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: error.message || "Unknown error" };
  }
}


