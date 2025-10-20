# Payment System Testing Guide

This guide covers comprehensive testing of the AgriReach payment system with PayMongo integration.

## Test Environment Setup

### 1. Environment Variables
Ensure these are set in your `.env.local`:

```env
# PayMongo Test Keys
PAYMONGO_SECRET_KEY=sk_test_your_test_secret_key
PAYMONGO_PUBLIC_KEY=pk_test_your_test_public_key
PAYMONGO_WEBHOOK_SECRET=your_webhook_secret

# Application URLs
BASE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Test Data Setup
Create test users with different roles:
- Buyer account for testing payments
- Seller account for receiving payments
- Admin account for monitoring

## Payment Method Testing

### Cash on Delivery (COD)
**Test Case 1: Successful COD Order**
1. Add items to cart
2. Proceed to checkout
3. Select "Cash on Delivery"
4. Fill delivery and billing details
5. Complete checkout
6. Verify order creation in database
7. Check payment status is "paid"

**Expected Result:**
- Order created with status "pending"
- Payment status "paid"
- Product quantities reduced
- Cart items removed

### GCash Payments
**Test Case 2: Successful GCash Payment**
1. Add items to cart
2. Proceed to checkout
3. Select "GCash"
4. Fill delivery and billing details
5. Complete checkout
6. Verify redirect to PayMongo GCash page
7. Complete payment on PayMongo
8. Verify redirect back to success page
9. Check payment confirmation

**Test Case 3: Failed GCash Payment**
1. Follow steps 1-6 from Test Case 2
2. Cancel payment on PayMongo page
3. Verify redirect to failure page
4. Check payment status is "failed"

### GrabPay Payments
**Test Case 4: Successful GrabPay Payment**
1. Add items to cart
2. Proceed to checkout
3. Select "GrabPay"
4. Fill delivery and billing details
5. Complete checkout
6. Verify redirect to PayMongo GrabPay page
7. Complete payment on PayMongo
8. Verify redirect back to success page
9. Check payment confirmation

### Card Payments
**Test Case 5: Successful Card Payment**
1. Add items to cart
2. Proceed to checkout
3. Select "Card"
4. Fill delivery and billing details
5. Complete checkout
6. Verify payment intent creation
7. Use PayMongo test card details
8. Complete payment
9. Verify payment confirmation

**Test Card Numbers (PayMongo Test Mode):**
- Success: 4242424242424242
- Decline: 4000000000000002
- Insufficient Funds: 4000000000009995
- Expired Card: 4000000000000069

## API Testing

### 1. Create Payment Endpoint
```bash
POST /api/marketplace/checkout/create-payment
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "items": ["cart_item_id_1", "cart_item_id_2"],
  "delivery_address": {
    "line1": "123 Test Street",
    "city": "Manila",
    "state": "Metro Manila",
    "postal_code": "1000",
    "country": "PH"
  },
  "payment_method": "gcash",
  "billing_details": {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+639123456789"
  }
}
```

### 2. Confirm Payment Endpoint
```bash
POST /api/marketplace/checkout/confirm-payment
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "source_id": "src_test_123456789"
}
```

### 3. Payment Status Endpoint
```bash
GET /api/payments?status=paid&page=1&limit=10
Authorization: Bearer <access_token>
```

### 4. Refund Endpoint
```bash
POST /api/payments/refund
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "payment_id": "payment_id_here",
  "amount": 100.00,
  "reason": "Customer requested refund"
}
```

## Webhook Testing

### 1. Webhook Endpoint
```bash
POST /api/payments/webhook
Content-Type: application/json
PayMongo-Signature: <webhook_signature>

{
  "type": "payment.succeeded",
  "data": {
    "id": "pay_test_123456789",
    "type": "payment",
    "attributes": {
      "status": "paid",
      "amount": 10000,
      "currency": "PHP"
    }
  }
}
```

### 2. Webhook Events to Test
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `source.chargeable`
- `payment.succeeded`
- `payment.failed`

## Error Handling Testing

### 1. Invalid Payment Methods
- Test with unsupported payment methods
- Verify proper error messages

### 2. Insufficient Stock
- Create order with more quantity than available
- Verify error handling

### 3. Network Errors
- Simulate network failures
- Test retry mechanisms

### 4. Invalid Data
- Test with malformed request data
- Verify validation errors

## Security Testing

### 1. Authentication
- Test without valid JWT token
- Test with expired token
- Test with invalid token

### 2. Authorization
- Test buyer-only endpoints with seller account
- Test seller-only endpoints with buyer account

### 3. Webhook Security
- Test webhook without valid signature
- Test webhook with invalid signature

## Performance Testing

### 1. Load Testing
- Test with multiple concurrent payments
- Monitor database performance
- Check PayMongo API rate limits

### 2. Timeout Testing
- Test payment confirmation timeouts
- Test webhook processing delays

## Database Testing

### 1. Payment Model
- Verify payment creation
- Check payment status updates
- Test payment expiration (TTL)

### 2. Order Model
- Verify order creation
- Check order status updates
- Test order-payment relationships

### 3. Data Integrity
- Test foreign key constraints
- Verify data consistency
- Test rollback scenarios

## Frontend Testing

### 1. Checkout Flow
- Test checkout modal functionality
- Verify form validation
- Test payment method selection

### 2. Payment Pages
- Test success page rendering
- Test failure page rendering
- Verify redirect handling

### 3. Error Handling
- Test error message display
- Verify retry mechanisms
- Test user feedback

## Monitoring and Logging

### 1. Payment Logs
- Check payment creation logs
- Monitor payment status changes
- Track webhook events

### 2. Error Logs
- Monitor failed payments
- Track API errors
- Check webhook failures

### 3. Performance Metrics
- Monitor payment processing times
- Track success/failure rates
- Monitor API response times

## Test Scenarios Checklist

- [ ] COD payment flow
- [ ] GCash payment flow
- [ ] GrabPay payment flow
- [ ] Card payment flow
- [ ] Payment confirmation
- [ ] Payment failure handling
- [ ] Webhook processing
- [ ] Refund processing
- [ ] Error handling
- [ ] Security validation
- [ ] Performance under load
- [ ] Database integrity
- [ ] Frontend integration
- [ ] API documentation
- [ ] Logging and monitoring

## Troubleshooting Common Issues

### 1. Payment Not Confirming
- Check webhook endpoint accessibility
- Verify webhook signature validation
- Check PayMongo dashboard for payment status

### 2. Orders Not Creating
- Verify payment status is "paid"
- Check order creation logic
- Verify product stock availability

### 3. Webhook Not Receiving
- Check webhook URL configuration
- Verify PayMongo webhook settings
- Check network connectivity

### 4. Refund Issues
- Verify payment is eligible for refund
- Check PayMongo refund API
- Verify refund amount calculations

## Production Deployment Checklist

- [ ] Update to live PayMongo keys
- [ ] Configure production webhook URLs
- [ ] Set up monitoring and alerts
- [ ] Test with real payment methods
- [ ] Verify SSL certificates
- [ ] Check rate limiting
- [ ] Monitor error rates
- [ ] Set up backup procedures
