import Image from 'next/image';
import {Heart} from 'lucide-react';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {NavigationLink} from '@/components/shared/navigation-link';
import {FooterNewsletter} from '@/components/layout/footer/footer-newsletter';
import {FooterSocialLinks} from '@/components/layout/footer/footer-social-links';
import {FooterPaymentIcons} from '@/components/layout/footer/footer-payment-icons';
import {
    FOOTER_ABOUT_LINKS,
    FOOTER_HELP_LINKS,
    FOOTER_SHOP_COLUMNS,
} from '@/lib/footer-links';
import type {NavLinkKey} from '@/lib/nav-links';
import {MAIN_NAV_LINKS} from '@/lib/nav-links';

const NAV_HREF_BY_KEY = Object.fromEntries(
    MAIN_NAV_LINKS.map(({key, href}) => [key, href]),
) as Record<NavLinkKey, string>;

const COPYRIGHT_YEAR = new Date().getFullYear();

export async function Footer() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Footer'});
    const navT = await getTranslations({locale, namespace: 'Navigation'});

    return (
        <footer className="mt-auto bg-white">
            <FooterNewsletter />

            <div className="container mx-auto px-4 py-12 md:py-14">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.1fr)_repeat(4,minmax(0,1fr))] lg:gap-8 xl:gap-10">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <NavigationLink href="/" className="inline-block">
                            <Image
                                src="/logo-small.png"
                                alt="BuySome Knickers"
                                width={148}
                                height={52}
                                className="h-11 w-auto"
                            />
                        </NavigationLink>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-charcoal">
                            {t('shop')}
                        </h3>
                        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
                            {FOOTER_SHOP_COLUMNS.map((column, columnIndex) => (
                                <ul key={columnIndex} className="space-y-2.5">
                                    {column.map((key) => (
                                        <li key={key}>
                                            <FooterLink
                                                href={NAV_HREF_BY_KEY[key]}
                                                label={navT(`nav.${key}`)}
                                                highlight={key === 'sale'}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-charcoal">
                            {t('help')}
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {FOOTER_HELP_LINKS.map(({key, href}) => (
                                <li key={key}>
                                    <FooterLink href={href} label={t(`helpLinks.${key}`)} />
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-charcoal">
                            {t('about')}
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {FOOTER_ABOUT_LINKS.map(({key, href}) => (
                                <li key={key}>
                                    <FooterLink href={href} label={t(`aboutLinks.${key}`)} />
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-charcoal">
                            {t('followUs')}
                        </h3>
                        <FooterSocialLinks className="mt-4" />
                        <p className="mt-3 text-sm text-muted-foreground">{t('tagUs')}</p>
                    </div>
                </div>
            </div>

            <div className="border-t border-border/60">
                <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-5 md:flex-row md:justify-between">
                    <p className="flex items-center gap-1.5 text-center text-xs text-muted-foreground md:text-left">
                        {t('copyright', {year: COPYRIGHT_YEAR})}
                        <Heart className="size-3 fill-brand-pink text-brand-pink" aria-hidden="true" />
                    </p>
                    <FooterPaymentIcons />
                </div>
            </div>
        </footer>
    );
}

function FooterLink({
    href,
    label,
    highlight = false,
}: {
    href: string;
    label: string;
    highlight?: boolean;
}) {
    return (
        <NavigationLink
            href={href}
            className={
                highlight
                    ? 'text-sm text-brand-pink transition-colors hover:text-brand-pink/80'
                    : 'text-sm text-brand-charcoal/80 transition-colors hover:text-brand-pink'
            }
        >
            {label}
        </NavigationLink>
    );
}
