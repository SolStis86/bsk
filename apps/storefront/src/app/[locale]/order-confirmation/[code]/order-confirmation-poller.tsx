'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const SETTLED_STATES = new Set(['PaymentSettled', 'Delivered', 'PartiallyDelivered', 'Cancelled']);

interface OrderConfirmationPollerProps {
    orderCode: string;
    initialState: string;
    children: React.ReactNode;
}

export function OrderConfirmationPoller({
    orderCode,
    initialState,
    children,
}: OrderConfirmationPollerProps) {
    const t = useTranslations('OrderConfirmation');
    const router = useRouter();
    const [orderState, setOrderState] = useState(initialState);
    const [polling, setPolling] = useState(!SETTLED_STATES.has(initialState));

    useEffect(() => {
        if (SETTLED_STATES.has(orderState)) {
            setPolling(false);
            return;
        }

        let attempts = 0;
        const maxAttempts = 5;
        const interval = window.setInterval(() => {
            attempts += 1;
            router.refresh();

            if (attempts >= maxAttempts) {
                window.clearInterval(interval);
                setPolling(false);
            }
        }, 2000);

        return () => window.clearInterval(interval);
    }, [orderCode, orderState, router]);

    useEffect(() => {
        setOrderState(initialState);
        setPolling(!SETTLED_STATES.has(initialState));
    }, [initialState]);

    if (polling && !SETTLED_STATES.has(orderState)) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
                <h1 className="text-2xl font-semibold mb-2">{t('confirmingPayment')}</h1>
                <p className="text-muted-foreground">{t('confirmingPaymentDescription')}</p>
            </div>
        );
    }

    return <>{children}</>;
}
