import {Truck, Heart, RotateCcw} from 'lucide-react';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';

export async function PromoBar() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Navigation'});

    const items = [
        {icon: Truck, label: t('promo.freeDelivery')},
        {icon: Heart, label: t('promo.discreetPackaging')},
        {icon: RotateCcw, label: t('promo.easyReturns')},
    ] as const;

    return (
        <div className="bg-brand-pink text-white">
            <div className="container mx-auto px-4">
                <div className="hidden md:grid md:grid-cols-3 md:items-center md:gap-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em]">
                    {items.map(({icon: Icon, label}) => (
                        <div
                            key={label}
                            className="flex items-center justify-center gap-2 text-center"
                        >
                            <Icon className="size-3.5 shrink-0" strokeWidth={2.25} />
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
                <div className="flex md:hidden items-center justify-center gap-2 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em]">
                    <Truck className="size-3.5 shrink-0" strokeWidth={2.25} />
                    <span>{t('promo.freeDelivery')}</span>
                </div>
            </div>
        </div>
    );
}
