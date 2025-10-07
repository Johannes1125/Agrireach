# PayMongo Integration Guide

This document explains how to set up and use PayMongo payment gateway for the AgriReach marketplace.

## 🇵🇭 About PayMongo

PayMongo is the leading payment gateway in the Philippines, supporting:
- GCash
- GrabPay
- Credit/Debit Cards
- PayMaya (coming soon)

## Prerequisites

1. A PayMongo account (Sign up at https://paymongo.com/)
2. API keys from PayMongo Dashboard

## Setup Instructions

### 1. Get PayMongo API Keys

1. Go to https://dashboard.paymongo.com/
2. Navigate to **Developers** > **API Keys**
3. Copy your **Secret Key** and **Public Key**
4. For testing, use the **Test Mode** keys

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# PayMongo Configuration
PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Important:** Never commit your secret keys to version control!

### 3. Test Keys vs Live Keys

- **Test Keys**: Start with `sk_test_` and `pk_test_`
  - Use for development and testing
  - No real money is charged
  - Can use test GCash/card numbers

- **Live Keys**: Start with `sk_live_` and `pk_live_`
  - Use only in production
  - Real money transactions
  - Requires business verification

## Features Implemented

### ✅ Checkout Flow

1. **Item Selection**
   - Users can select one or multiple items from cart
   - View order summary with total calculation
   - Select all / Deselect all functionality

2. **Delivery & Billing Details**
   - Complete delivery address input
   - Billing information (name, email, phone)
   - Form validation

3. **Payment Method Selection**
   - GCash (Recommended)
   - GrabPay
   - Credit/Debit Card (Coming soon)

4. **Payment Processing**
   - Secure redirect to PayMongo checkout page
   - Real-time payment status tracking
   - Automatic order creation on successful payment

### 🛒 Shopping Cart

- Add items to cart from product listings
- View cart count in header
- Persistent cart storage in MongoDB
- Cart items automatically removed after successful checkout

### 📦 Order Management

- Multi-seller support (creates separate orders per seller)
- Automatic product quantity updates
- Email notifications to sellers
- Order tracking and status updates

## How to Use (For Testing)

### 1. Add Items to Cart

```typescript
// Items are added via the marketplace interface
// or programmatically:
const res = await authFetch("/api/marketplace/cart", {
  method: "POST",
  body: JSON.stringify({ product_id: "...", quantity: 1 })
})
```

### 2. Open Checkout Modal

Click the "Cart" button in the marketplace header to open the checkout modal.

### 3. Select Items

- By default, all items are selected
- Click on items to toggle selection
- Use "Select All" / "Deselect All" buttons

### 4. Enter Details

- Delivery address (required)
- Full name (required)
- Email address (required)
- Phone number (optional)

### 5. Choose Payment Method

- **GCash**: Recommended for Philippine users
- **GrabPay**: Alternative e-wallet option

### 6. Complete Payment

- Click "Pay ₱XXX.XX" button
- You'll be redirected to PayMongo's secure checkout page
- Complete payment using your chosen method
- Automatic redirect back to success/failure page

## Test Payment Details

### GCash Test

When testing GCash payments in test mode:
1. You'll see a PayMongo test checkout page
2. Use the test payment button to simulate successful payment
3. No real money is charged

### Test Card Numbers (Card payments - coming soon)

```
Successful Payment:
Card Number: 4123 4500 0000 0008
CVC: Any 3 digits
Expiry: Any future date

Failed Payment:
Card Number: 4571 7360 0000 0008
```

## API Endpoints

### Create Payment
```
POST /api/marketplace/checkout/create-payment
```

**Body:**
```json
{
  "items": ["cart_item_id_1", "cart_item_id_2"],
  "delivery_address": "123 Street, City, Province",
  "payment_method": "gcash",
  "billing_details": {
    "name": "Juan Dela Cruz",
    "email": "juan@example.com",
    "phone": "+639123456789"
  }
}
```

**Response:**
```json
{
  "payment_type": "source",
  "source_id": "src_xxx",
  "checkout_url": "https://pm.link/xxx",
  "amount": 1000.00,
  "currency": "PHP",
  "status": "pending"
}
```

### Confirm Payment
```
POST /api/marketplace/checkout/confirm-payment
```

**Body:**
```json
{
  "source_id": "src_xxx",
  "cart_item_ids": ["cart_item_id_1"],
  "delivery_address": "123 Street, City, Province"
}
```

**Response:**
```json
{
  "success": true,
  "orders": ["order_id_1", "order_id_2"],
  "payment_status": "paid",
  "message": "Order created successfully"
}
```

## Payment Flow Diagram

```
User                     Frontend                  Backend                PayMongo
  |                         |                         |                      |
  |-- Click Checkout ------>|                         |                      |
  |                         |                         |                      |
  |                         |-- Create Payment ------>|                      |
  |                         |                         |-- API Call --------->|
  |                         |                         |<-- Payment URL ------|
  |                         |<-- Redirect URL --------|                      |
  |                         |                         |                      |
  |<-- Redirect to PayMongo |                         |                      |
  |------------------------>|                         |                      |
  |   (PayMongo Page)       |                         |                      |
  |                         |                         |                      |
  |-- Complete Payment ---->|                         |                      |
  |<-- Redirect to Success -|                         |                      |
  |                         |                         |                      |
  |                         |-- Confirm Payment ----->|                      |
  |                         |                         |-- Verify Payment --->|
  |                         |                         |<-- Status: Paid -----|
  |                         |                         |                      |
  |                         |                         |-- Create Order ----->|
  |                         |                         |-- Update Stock ----->|
  |                         |                         |-- Send Notification->|
  |                         |<-- Order Created -------|                      |
  |<-- Show Success --------|                         |                      |
```

## Security Notes

### ✅ Implemented Security Measures

1. **Server-side Validation**
   - All payment creation happens on the server
   - Cart items are validated before payment
   - Product availability checked before order creation

2. **Authentication Required**
   - Users must be logged in to checkout
   - JWT tokens used for API authentication

3. **Payment Verification**
   - Payment status verified with PayMongo before order creation
   - Prevents fake successful payments

4. **Secret Key Protection**
   - Secret keys never exposed to client
   - All PayMongo API calls from server only

### 🔒 Best Practices

- Never expose secret keys in client-side code
- Always verify payment status on the server
- Use HTTPS in production
- Implement webhook handlers for real-time updates (recommended)
- Log all payment transactions for audit trail

## Troubleshooting

### Payment Not Confirming

1. Check PayMongo Dashboard for transaction status
2. Verify environment variables are set correctly
3. Check browser console for errors
4. Ensure `sessionStorage` is enabled in browser

### Orders Not Creating

1. Check MongoDB connection
2. Verify product quantities are available
3. Check server logs for errors
4. Ensure cart items exist and belong to user

### Redirect Issues

1. Verify `NEXT_PUBLIC_BASE_URL` is set correctly
2. Check PayMongo redirect URLs in response
3. Ensure success/failed pages are accessible

## Going Live

### Before Switching to Production:

1. ✅ Get PayMongo account verified
2. ✅ Switch to live API keys in production environment
3. ✅ Test thoroughly with small amounts first
4. ✅ Set up webhook handlers for payment updates
5. ✅ Implement proper error handling and logging
6. ✅ Add email confirmations for orders
7. ✅ Set up customer support system

### Production Checklist:

- [ ] Live API keys configured in production environment
- [ ] HTTPS enabled
- [ ] Error monitoring set up (Sentry, etc.)
- [ ] Webhook endpoints configured
- [ ] Order confirmation emails working
- [ ] Customer support ready
- [ ] Refund process documented
- [ ] Legal terms and conditions updated

## Support

- **PayMongo Documentation**: https://developers.paymongo.com/
- **PayMongo Support**: support@paymongo.com
- **Test Mode Dashboard**: https://dashboard.paymongo.com/test

## Next Steps (Recommended)

1. **Implement Webhooks**
   - Real-time payment status updates
   - Handle payment disputes
   - Automated refund processing

2. **Add Card Payments**
   - Integrate PayMongo.js for card payments
   - Implement 3D Secure authentication

3. **Order Tracking**
   - Email notifications for order updates
   - SMS notifications via Twilio/Semaphore

4. **Analytics**
   - Track conversion rates
   - Monitor payment success/failure rates
   - Analyze popular payment methods

---

**Last Updated**: 2025-10-06
**Version**: 1.0.0

