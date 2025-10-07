import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { CartItem, Product } from "@/server/models/Product";
import { createPaymentIntent, createSource } from "@/lib/paymongo";
import { z } from "zod";

const CheckoutSchema = z.object({
  items: z.array(z.string()).min(1, "At least one item required"),
  delivery_address: z.string().min(5, "Delivery address is required"),
  payment_method: z.enum(["card", "gcash", "grab_pay", "paymaya"]),
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
      return jsonError(result.error.errors[0].message, 400);
    }

    const { items: cartItemIds, delivery_address, payment_method, billing_details } = result.data;

    await connectToDatabase();

    // Fetch cart items with product details
    const cartItems = await CartItem.find({
      _id: { $in: cartItemIds },
      user_id: decoded.sub,
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

    // Create payment based on method
    if (payment_method === "card") {
      // For card payments, create a PaymentIntent
      const paymentIntent = await createPaymentIntent({
        amount: amountInCentavos,
        currency: "PHP",
        description: `AgriReach Marketplace Order - ${orderItems.map(i => i.title).join(", ")}`,
        statement_descriptor: "AgriReach Purchase",
        metadata: {
          user_id: decoded.sub,
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
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace/payment/success`,
          failed: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace/payment/failed`,
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
  } catch (error: any) {
    console.error("Checkout error:", error);
    return jsonError(error.message || "Failed to process checkout", 500);
  }
}

