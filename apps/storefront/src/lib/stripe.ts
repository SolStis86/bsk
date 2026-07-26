/** Payment method code configured in Vendure Admin for Stripe checkout. */
export const STRIPE_PAYMENT_METHOD_CODE = 'stripe';

export function getStripePublishableKey(): string {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
        throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured');
    }
    return key;
}

export function isStripePaymentMethod(code: string | null | undefined): boolean {
    return code === STRIPE_PAYMENT_METHOD_CODE;
}
