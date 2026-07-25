import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {getMainNavCollections} from '@/lib/vendure/cached';
import {cn} from '@/lib/utils';

export async function NavbarNavLinks() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Navigation'});
    const navLinks = await getMainNavCollections(locale);

    return (
        <nav className="hidden xl:flex items-center gap-5 2xl:gap-6" aria-label={t('mainMenu')}>
            {navLinks.map(({slug, name, highlight}) => (
                <Link
                    key={slug}
                    href={`/collection/${slug}`}
                    className={cn(
                        'text-[11px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap transition-colors hover:text-brand-pink',
                        highlight ? 'text-brand-pink' : 'text-brand-charcoal',
                    )}
                >
                    {name}
                </Link>
            ))}
        </nav>
    );
}
