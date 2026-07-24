import Image from 'next/image';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/i18n/server';
import {HeroCtaButtons} from '@/components/brand/hero-cta-buttons';

export async function HeroSection() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Hero'});

    return (
        <section className="relative w-full overflow-hidden">
            <div className="relative aspect-[1938/811] w-full">
                <Image
                    src="/home-hero.png"
                    alt={t('imageAlt')}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-center"
                />

                <div className="absolute inset-x-0 bottom-[14%] flex justify-start px-[6%] sm:bottom-[16%] sm:px-[8%] lg:px-[10%]">
                    <HeroCtaButtons
                        shopNewInLabel={t('shopNewIn')}
                        shopCollectionsLabel={t('shopCollections')}
                    />
                </div>
            </div>
        </section>
    );
}
