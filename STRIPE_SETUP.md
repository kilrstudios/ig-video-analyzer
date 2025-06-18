# Stripe Token Purchase Integration Setup

This guide will help you set up the Stripe integration for token purchasing in your video analyzer application.

## Overview

The integration includes:
- ✅ 4 token pack tiers with volume discounts
- ✅ Secure Stripe Checkout sessions
- ✅ Webhook handling for payment completion
- ✅ Automatic credit addition to user accounts
- ✅ Payment success/failure handling

## Token Pack Pricing

| Pack Size | Cost | Per Token | Total Price | Discount |
|-----------|------|-----------|-------------|----------|
| 10 tokens | $1.00 | $0.25 | $2.50 | Base Price |
| 50 tokens | $5.00 | $0.23 | $11.50 | 8% off |
| 100 tokens | $10.00 | $0.22 | $22.00 | 12% off |
| 500 tokens | $50.00 | $0.20 | $100.00 | 20% off |

## Stripe Account Setup

### 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete your account verification
3. Navigate to your Stripe Dashboard

### 2. Get API Keys
1. In your Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_test_` for test mode)
3. Copy your **Secret key** (starts with `sk_test_` for test mode)

### 3. Set Up Webhooks
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
# For development:
# NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Testing the Integration

### Test Mode
- Use Stripe's test mode during development
- Test card numbers:
  - `4242424242424242` (Visa, always succeeds)
  - `4000000000000002` (Card declined)
  - `4000000000009995` (Insufficient funds)

### Test the Flow
1. Sign in to your application
2. Click on your profile/credits area to open the dashboard
3. Go to the "Credits" tab
4. Click "Purchase" on any token pack
5. Complete the test payment with a test card
6. Verify credits are added to your account

## How It Works

### 1. Purchase Flow
```
User clicks "Purchase" 
→ Create Stripe checkout session (API: /api/stripe/create-checkout-session)
→ Redirect to Stripe Checkout
→ User completes payment
→ Stripe redirects back with success/cancel
→ Show success modal and refresh user credits
```

### 2. Webhook Processing
```
Stripe sends webhook to /api/stripe/webhook
→ Verify webhook signature
→ Extract payment metadata (user ID, tokens, pack type)
→ Add credits using Supabase function add_credits()
→ Record transaction in credit_transactions table
```

### 3. Database Updates
- Credits are added to `user_profiles.credits_balance`
- Transaction is recorded in `credit_transactions` table
- `total_credits_purchased` is updated

## API Endpoints

### `/api/stripe/create-checkout-session`
- **Method**: POST
- **Body**: `{ packType: string, userId: string }`
- **Response**: `{ sessionId: string }`

### `/api/stripe/webhook`
- **Method**: POST
- **Headers**: `stripe-signature`
- **Body**: Stripe webhook payload
- **Response**: `{ received: true }`

## Components

### `UserDashboard`
- Updated with new pricing structure
- Integrated purchase buttons
- Loading states during purchase

### `PurchaseSuccess`
- Success modal after payment
- Refreshes user profile
- Clean URL handling

## Security Features

- ✅ Webhook signature verification
- ✅ User authentication required
- ✅ Server-side price validation
- ✅ Metadata validation in webhooks
- ✅ SQL injection protection via Supabase RPC

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is publicly accessible
   - Verify HTTPS is working
   - Check webhook secret matches environment variable

2. **Payment succeeds but credits not added**
   - Check webhook logs in Stripe Dashboard
   - Verify Supabase RPC function `add_credits` exists
   - Check database connection and permissions

3. **Redirect URLs not working**
   - Verify `NEXT_PUBLIC_BASE_URL` is correct
   - Ensure domain matches Stripe settings

### Debug Mode
Add logging to webhook endpoint:
```javascript
console.log('Webhook event type:', event.type);
console.log('Session metadata:', session.metadata);
```

## Going Live

### Production Checklist
- [ ] Switch to Stripe live keys
- [ ] Update webhook endpoint to production URL
- [ ] Test with real payment methods
- [ ] Set up proper error monitoring
- [ ] Configure webhook retry settings
- [ ] Set up Stripe monitoring alerts

### Security Recommendations
- [ ] Use HTTPS everywhere
- [ ] Validate webhook signatures
- [ ] Store sensitive keys in secure environment
- [ ] Monitor for unusual payment patterns
- [ ] Set up proper error handling

## Support

For technical issues:
1. Check Stripe Dashboard logs
2. Review application logs
3. Test webhook delivery in Stripe
4. Verify environment variables

The integration is now complete and ready for testing! 🎉 