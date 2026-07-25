import {Suspense} from 'react';
import {MobileNav} from '@/components/layout/navbar/mobile-nav';
import {LanguagePicker} from '@/components/layout/navbar/language-picker';
import {CurrencyPickerWrapper} from '@/components/layout/navbar/currency-picker-wrapper';
import {getMainNavCollections} from '@/lib/vendure/cached';
import {getRouteLocale} from '@/i18n/server';

export async function MobileNavWrapper() {
    const locale = await getRouteLocale();
    const navLinks = await getMainNavCollections(locale);

    return (
        <MobileNav
            navLinks={navLinks}
            preferences={
                <div className="flex items-center gap-3 px-3 pt-2 border-t">
                    <LanguagePicker />
                    <Suspense fallback={null}>
                        <CurrencyPickerWrapper />
                    </Suspense>
                </div>
            }
        />
    );
}
