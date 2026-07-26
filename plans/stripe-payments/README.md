# Stripe Payments

Real card checkout via [@vendure-community/stripe-plugin](https://docs.vendure.io/current/community-plugins/stripe-plugin) and Stripe Payment Intents.

Dummy payment (`standard-payment`) remains available for local e2e and dev without Stripe CLI.

## Architecture

1. Storefront transitions order to `ArrangingPayment`
2. Shop API mutation `createStripePaymentIntent` returns a client secret
3. Stripe Payment Element collects card details; `confirmPayment` redirects to order confirmation
4. Stripe webhook `POST /payments/stripe` settles the order server-side (worker must be running)

## Server setup

Plugin registered in [`apps/server/src/vendure-config.ts`](../../apps/server/src/vendure-config.ts):

```ts
StripePlugin.init({
  storeCustomersInStripe: true,
  skipPaymentIntentsWithoutExpectedMetadata: true,
}),
```

Run migration after pulling:

```bash
cd apps/server && npx vendure migrate -r
```

### Admin: create Stripe payment method

1. Open Vendure Dashboard → **Settings → Payment methods → Create**
2. **Handler:** Stripe payments
3. **Code:** `stripe` (must match storefront constant `STRIPE_PAYMENT_METHOD_CODE`)
4. **API key:** Stripe secret key (`sk_test_…` or `sk_live_…`)
5. **Webhook secret:** signing secret from Stripe Dashboard or Stripe CLI (see below)
6. Enable the method and assign it to your channel
7. Optionally disable dummy `standard-payment` in production

## Storefront env

Add to `apps/storefront/.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

`NEXT_PUBLIC_SITE_URL` is used for the Stripe `return_url` after payment.

## Local development with Stripe CLI

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Start Vendure server + worker + storefront
3. Forward webhooks:

```bash
stripe listen --forward-to localhost:3000/payments/stripe
```

4. Copy the webhook signing secret (`whsec_…`) into the Stripe payment method in Admin (or update if CLI generates a new one each session)
5. Checkout with test card `4242 4242 4242 4242`

## Production webhook

Configure in Stripe Dashboard:

- **URL:** `https://<your-vendure-host>/payments/stripe`
- **Events:** `payment_intent.succeeded`, `payment_intent.payment_failed`
- Ensure the load balancer passes the **raw request body** to Vendure (required for signature verification)

## Dummy payment (dev / e2e)

E2e fixtures still seed `Standard Payment` with the dummy handler. To test dummy checkout locally, keep that payment method enabled alongside Stripe.

## Troubleshooting

| Symptom | Check |
|---|---|
| Order stuck on “Confirming payment…” | Worker running? Stripe CLI forwarding? Webhook secret matches Admin payment method? |
| `createStripePaymentIntent` fails | Order in `ArrangingPayment`? Stripe API key valid on payment method? |
| Payment Element blank | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set? Browser console for Stripe errors |
