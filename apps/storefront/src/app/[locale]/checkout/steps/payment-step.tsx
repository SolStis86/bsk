'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { CreditCard, Loader2 } from 'lucide-react';
import { useCheckout } from '../checkout-provider';
import { prepareStripePayment } from '../actions';
import { useTranslations, useLocale } from 'next-intl';
import { isStripePaymentMethod } from '@/lib/stripe';
import { StripePayments } from '@/components/checkout/stripe/stripe-payments';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentStepProps {
  onComplete: () => void;
}

export default function PaymentStep({ onComplete }: PaymentStepProps) {
  const t = useTranslations('Checkout');
  const locale = useLocale();
  const { paymentMethods, selectedPaymentMethodCode, setSelectedPaymentMethodCode } = useCheckout();
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeSession, setStripeSession] = useState<{
    clientSecret: string;
    orderCode: string;
  } | null>(null);

  const selectedIsStripe = isStripePaymentMethod(selectedPaymentMethodCode);

  const handleContinue = () => {
    if (!selectedPaymentMethodCode) return;
    onComplete();
  };

  const handlePrepareStripe = async () => {
    setLoadingStripe(true);
    setStripeError(null);
    try {
      const session = await prepareStripePayment();
      setStripeSession(session);
    } catch (error) {
      console.error('Error preparing Stripe payment:', error);
      setStripeError(error instanceof Error ? error.message : t('stripePaymentFailed'));
    } finally {
      setLoadingStripe(false);
    }
  };

  if (paymentMethods.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('noPaymentMethods')}</p>
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
  const stripeReturnUrl = `${siteUrl}/${locale}/order-confirmation/${stripeSession?.orderCode ?? ''}`;

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">{t('selectPaymentMethod')}</h3>

      {!stripeSession && (
        <>
          <RadioGroup value={selectedPaymentMethodCode || ''} onValueChange={setSelectedPaymentMethodCode}>
            {paymentMethods.map((method) => (
              <Label key={method.code} htmlFor={method.code} className="cursor-pointer">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={method.code} id={method.code} />
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{method.name}</p>
                      {method.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {method.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Label>
            ))}
          </RadioGroup>

          {stripeError && (
            <Alert variant="destructive">
              <AlertDescription>{stripeError}</AlertDescription>
            </Alert>
          )}

          {selectedIsStripe ? (
            <Button
              onClick={handlePrepareStripe}
              disabled={!selectedPaymentMethodCode || loadingStripe}
              className="w-full"
            >
              {loadingStripe && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('continueToStripePayment')}
            </Button>
          ) : (
            <Button
              onClick={handleContinue}
              disabled={!selectedPaymentMethodCode}
              className="w-full"
            >
              {t('continueToReview')}
            </Button>
          )}
        </>
      )}

      {stripeSession && (
        <div className="space-y-4">
          <StripePayments
            clientSecret={stripeSession.clientSecret}
            orderCode={stripeSession.orderCode}
            returnUrl={stripeReturnUrl}
          />
          <Button
            variant="outline"
            onClick={() => setStripeSession(null)}
            className="w-full"
          >
            {t('changePaymentMethod')}
          </Button>
        </div>
      )}
    </div>
  );
}
