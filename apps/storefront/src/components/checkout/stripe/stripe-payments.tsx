'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { StripeCheckoutForm } from './stripe-checkout-form';
import { getStripePublishableKey } from '@/lib/stripe';

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> {
    if (!stripePromise) {
        stripePromise = loadStripe(getStripePublishableKey());
    }
    return stripePromise;
}

interface StripePaymentsProps {
    clientSecret: string;
    orderCode: string;
    returnUrl: string;
}

export function StripePayments({ clientSecret, orderCode, returnUrl }: StripePaymentsProps) {
    return (
        <Elements
            stripe={getStripe()}
            options={{
                clientSecret,
                appearance: {
                    theme: 'stripe',
                },
            }}
        >
            <StripeCheckoutForm orderCode={orderCode} returnUrl={returnUrl} />
        </Elements>
    );
}
