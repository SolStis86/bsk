import type {Metadata} from "next";
import {Suspense} from "react";
import {getRouteLocale} from "@/i18n/server";
import {HeroSection} from "@/components/layout/hero-section";
import {HomepageCategories} from "@/components/commerce/homepage-categories";
import {FeaturedProducts} from "@/components/commerce/featured-products";
import {SITE_NAME, SITE_URL, buildCanonicalUrl} from "@/lib/metadata";
import {BadgeCheck, Tag, Zap} from "lucide-react";
import {getTranslations} from 'next-intl/server';
import {toOgLocale} from '@/i18n/locale-utils';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});
    const ogLocale = toOgLocale(locale);

    return {
        title: {
            absolute: `${SITE_NAME} - ${t('pageTitle')}`,
        },
        description: t('description'),
        alternates: {
            canonical: buildCanonicalUrl("/"),
        },
        openGraph: {
            title: `${SITE_NAME} - ${t('pageTitle')}`,
            description: t('ogDescription'),
            type: "website",
            locale: ogLocale,
            url: SITE_URL,
        },
    };
}

const featureKeys = [
    {icon: BadgeCheck, key: 'highQuality'},
    {icon: Tag, key: 'bestPrices'},
    {icon: Zap, key: 'fastDelivery'},
] as const;

export default async function Home() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Home'});

    return (
        <div className="min-h-screen">
            <HeroSection/>
            <Suspense>
                <HomepageCategories/>
            </Suspense>
            <Suspense>
                <FeaturedProducts/>
            </Suspense>

            <section className="bg-brand-cream py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <h2 className="mb-12 text-center font-heading text-2xl font-bold tracking-tight text-brand-charcoal md:text-3xl">
                        {t('whyShopWithUs')}
                    </h2>
                    <div className="grid gap-8 md:grid-cols-3">
                        {featureKeys.map((feature) => (
                            <div
                                key={feature.key}
                                className="group relative space-y-4 rounded-lg bg-card p-8 text-center shadow-sm transition-shadow duration-300 hover:shadow-md"
                            >
                                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-pink/10 transition-colors duration-300 group-hover:bg-brand-pink/20">
                                    <feature.icon className="size-6 text-brand-pink" />
                                </div>
                                <h3 className="font-heading text-xl font-semibold text-brand-charcoal">{t(`features.${feature.key}.title`)}</h3>
                                <p className="leading-relaxed text-muted-foreground">{t(`features.${feature.key}.description`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
