import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {MAIN_NAV_LINKS} from '@/lib/nav-links';
import {cn} from '@/lib/utils';

export async function NavbarNavLinks() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Navigation'});

    return (
        <nav className="hidden xl:flex items-center gap-5 2xl:gap-6" aria-label={t('mainMenu')}>
            {MAIN_NAV_LINKS.map(({key, href, highlight}) => (
                <Link
                    key={key}
                    href={href}
                    className={cn(
                        'text-[11px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap transition-colors hover:text-brand-pink',
                        highlight ? 'text-brand-pink' : 'text-brand-charcoal',
                    )}
                >
                    {t(`nav.${key}`)}
                </Link>
            ))}
        </nav>
    );
}
