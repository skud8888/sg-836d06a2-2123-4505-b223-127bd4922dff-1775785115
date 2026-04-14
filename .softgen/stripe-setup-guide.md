# Stripe Integration Setup Guide

## Overview
The booking system is now fully integrated with Stripe for payment processing, invoice generation, and automated confirmation emails.

## Prerequisites
You need a Stripe account. Sign up at: https://stripe.com/

## Setup Steps

### 1. Get Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com/
2. Click **Developers** → **API keys**
3. Copy the following keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 2. Configure Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL:
   ```
   https://your-domain.com/api/stripe/webhook
   ```
   For local testing:
   ```
   Use Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Select events to listen to:
   - `checkout.session.completed` ✅ (Required)

5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

### 3. Update Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
```

### 4. Restart Your Development Server

```bash
pm2 restart all
```

## Testing the Integration

### Test Payment Flow

1. Go to a course booking page: `/booking/[classId]`
2. Fill in student details
3. Click "Continue to Payment"
4. Select payment option:
   - **Pay in Full** - Full course amount
   - **Pay Deposit (30%)** - 30% deposit
   - **Custom Amount** - Enter any amount
5. Click "Continue to Payment"
6. Use Stripe test card:
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: Any future date
   CVC: Any 3 digits
   ```
7. Complete payment
8. You should be redirected to the success page

### What Happens After Payment

1. **Booking Updated** ✅
   - Payment status set to "paid" or "partial"
   - Paid amount updated
   - Status changed to "confirmed"

2. **Invoice Generated** ✅
   - Professional HTML invoice created
   - Sent to student email
   - Invoice number: `INV-[BOOKING-ID]-[TIMESTAMP]`

3. **Confirmation Email** ✅
   - Payment receipt sent
   - Booking details included
   - Next steps outlined

4. **E-Signature Request** ✅
   - Enrollment contract sent automatically
   - 7-day expiration
   - Trackable signature status

## Invoice Details

The invoice includes:
- Company information (GTS Training)
- Student details
- Course details (name, code, date, location)
- Payment breakdown (subtotal, GST, total)
- Payment status (paid amount, balance due)
- Bank details for remaining payments

## Webhook Events Processed

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Update booking, send invoice, send receipt, create signature request |

## Security Features

✅ **Webhook Signature Verification** - All webhooks verified with Stripe signature
✅ **Server-Side Processing** - Payments processed on server, not client
✅ **Secure Keys** - API keys stored in environment variables
✅ **Amount Validation** - Server validates payment amounts
✅ **Payment Intent Tracking** - Full audit trail of payments

## Testing Scenarios

### Scenario 1: Full Payment
- Amount: Full course price
- Expected: Payment status = "paid", booking status = "confirmed"
- Invoice: Balance due = $0.00

### Scenario 2: Deposit Payment
- Amount: 30% of course price
- Expected: Payment status = "partial", booking status = "confirmed"
- Invoice: Balance due = 70% remaining

### Scenario 3: Custom Amount
- Amount: Any amount between $1 and full price
- Expected: Payment status = "partial", booking status = "confirmed"
- Invoice: Balance due = Total - Amount paid

## Local Development with Stripe CLI

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login:
   ```bash
   stripe login
   ```
3. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret from CLI output
5. Update `.env.local` with the CLI webhook secret

## Production Deployment

### Before Going Live

1. **Switch to Live Keys**
   - Replace all `sk_test_` keys with `sk_live_` keys
   - Replace all `pk_test_` keys with `pk_live_` keys

2. **Update Webhook Endpoint**
   - Add production URL to Stripe webhooks
   - Use production webhook secret

3. **Update Company Information**
   - Edit `src/lib/invoiceGenerator.ts`
   - Add actual ABN, phone, email, bank details

4. **Test End-to-End**
   - Create test booking
   - Make small test payment
   - Verify all emails received
   - Check invoice accuracy

## Monitoring

Monitor payments in Stripe Dashboard:
- **Payments** - View all successful transactions
- **Customers** - View student payment history
- **Webhooks** - Monitor webhook delivery status
- **Events** - Debug webhook event flow

## Troubleshooting

### Payment Not Processing
- Check Stripe API keys are correct
- Verify webhook endpoint is accessible
- Check webhook signature verification

### Invoice Not Sending
- Check email service configuration
- Verify student email is valid
- Check server logs for errors

### Webhook Failing
- Check webhook secret is correct
- Verify endpoint URL is accessible
- Monitor webhook delivery in Stripe Dashboard

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com/
- Test Cards: https://stripe.com/docs/testing

## Next Steps

1. ✅ Set up Stripe account
2. ✅ Configure webhook endpoint
3. ✅ Add API keys to .env.local
4. ✅ Test payment flow
5. ✅ Update company information in invoices
6. 🔄 Switch to live keys before production