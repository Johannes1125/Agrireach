import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { CartItem, Product } from "@/server/models/Product";
import { User } from "@/server/models/User";
import { createPaymentIntent, createSource } from "@/lib/paymongo";
import { validateUserRole } from "@/server/utils/role-validation";
import { z } from "zod";

const PhilippineAddressSchema = z.object({
  region: z.string().min(1, "Region is required"),
  province: z.string().min(1, "Province is required"),
  city: z.string().min(1, "City/Municipality is required"),
  barangay: z.string().min(1, "Barangay is required"),
  streetAddress: z.string().optional(),
  zipCode: z.string().optional(),
});

const CheckoutSchema = z.object({
  items: z.array(z.string()).min(1, "At least one item required"),
  delivery_address: z.string().min(5, "Delivery address is required"),
  delivery_address_structured: PhilippineAddressSchema.optional(),
  payment_method: z.enum(["card", "gcash", "grab_pay", "paymaya", "cod"]),
  billing_details: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await req.json();
    const result = CheckoutSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0].message, 400);
    }

    const { items: cartItemIds, delivery_address, delivery_address_structured, payment_method, billing_details } = result.data;
    
    console.log("Payment method received:", payment_method);

    await connectToDatabase();

    // Check if user has buyer role
    try {
      const { user, userId } = await validateUserRole(req, ["buyer"]);
      
      // Fetch cart items with product details
      const cartItems = await CartItem.find({
        _id: { $in: cartItemIds },
        user_id: userId,
      }).populate("product_id");

    if (cartItems.length === 0) {
      return jsonError("No valid items found in cart", 400);
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems: Array<{
      product_id: string;
      quantity: number;
      price: number;
      title: string;
    }> = [];

    for (const item of cartItems) {
      const product = item.product_id as any;
      
      if (!product) {
        return jsonError("Product not found", 404);
      }

      if (product.status !== "active") {
        return jsonError(`Product "${product.title}" is not available`, 400);
      }

      if (product.quantity_available < item.quantity) {
        return jsonError(
          `Insufficient quantity for "${product.title}". Available: ${product.quantity_available}`,
          400
        );
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: product._id.toString(),
        quantity: item.quantity,
        price: product.price,
        title: product.title,
      });
    }

    // Convert to centavos (PayMongo uses centavos)
    const amountInCentavos = Math.round(totalAmount * 100);

    // Check if PayMongo is configured
    if (!process.env.PAYMONGO_SECRET_KEY && payment_method !== "cod") {
      return jsonError("Payment gateway not configured. Please contact support.", 500);
    }

    // Create payment based on method
    if (payment_method === "cod") {
      // For Cash on Delivery, create a simple order record
      return jsonOk({
        payment_type: "cod",
        order_id: `COD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount: totalAmount,
        currency: "PHP",
        status: "pending",
        message: "Order created successfully. Payment will be collected upon delivery.",
        order_items: orderItems,
        delivery_address: delivery_address_structured || delivery_address,
        billing_details,
      });
    } else if (payment_method === "card") {
      // For card payments, create a PaymentIntent
      const paymentIntent = await createPaymentIntent({
        amount: amountInCentavos,
        currency: "PHP",
        description: `AgriReach Marketplace Order - ${orderItems.map(i => i.title).join(", ")}`,
        statement_descriptor: "AgriReach Purchase",
        metadata: {
          user_id: userId,
          cart_item_ids: cartItemIds.join(","),
          delivery_address,
          order_items: JSON.stringify(orderItems),
        },
      });

      return jsonOk({
        payment_type: "card",
        client_key: paymentIntent.attributes.client_key,
        payment_intent_id: paymentIntent.id,
        amount: totalAmount,
        currency: "PHP",
        status: paymentIntent.attributes.status,
      });
    } else {
      // For e-wallet payments (GCash, GrabPay), create a Source
      const source = await createSource({
        type: payment_method === "gcash" ? "gcash" : "grab_pay",
        amount: amountInCentavos,
        currency: "PHP",
        redirect: {
          success: `${process.env.BASE_URL || 'http://localhost:3000'}/marketplace/payment/success`,
          failed: `${process.env.BASE_URL || 'http://localhost:3000'}/marketplace/payment/failed`,
        },
        billing: {
          name: billing_details.name,
          email: billing_details.email,
          phone: billing_details.phone || "",
        },
      });

      return jsonOk({
        payment_type: "source",
        source_id: source.id,
        checkout_url: source.attributes.redirect.checkout_url,
        amount: totalAmount,
        currency: "PHP",
        status: source.attributes.status,
      });
    }
  } catch (roleError: any) {
      return jsonError(roleError.message, 403);
    }
  } catch (error: any) {
    console.error("Checkout error:", error);
    return jsonError(error.message || "Failed to process checkout", 500);
  }
}

