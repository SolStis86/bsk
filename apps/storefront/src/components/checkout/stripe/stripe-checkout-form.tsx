'use client';

import { FormEvent, useState } from 'react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StripeCheckoutFormProps {
    orderCode: string;
    returnUrl: string;
}

export function StripeCheckoutForm({ orderCode, returnUrl }: StripeCheckoutFormProps) {
    const t = useTranslations('Checkout');
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setSubmitting(true);
        setErrorMessage(null);

        const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: returnUrl,
            },
        });

        if (result.error) {
            setErrorMessage(result.error.message ?? t('stripePaymentFailed'));
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {errorMessage && (
                <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
            <Button type="submit" disabled={!stripe || submitting} className="w-full">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('payNow')}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
                {t('stripeSecureCheckout', { orderCode })}
            </p>
        </form>
    );
}
