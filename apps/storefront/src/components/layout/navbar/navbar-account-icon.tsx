import {getRouteLocale} from '@/i18n/server';
import {User} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {LoginButton} from '@/components/layout/navbar/login-button';
import {getActiveCustomer} from '@/lib/vendure/actions';
import {getTranslations} from 'next-intl/server';
import {HeaderIconLink} from '@/components/layout/navbar/header-icon-link';

export async function NavbarAccountIcon() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Navigation'});
    const customer = await getActiveCustomer();

    if (!customer) {
        return (
            <HeaderIconLink href="/sign-in" label={t('account')}>
                <User className="size-5" strokeWidth={1.75} />
            </HeaderIconLink>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="relative inline-flex size-10 items-center justify-center text-brand-charcoal transition-colors hover:text-brand-pink outline-none"
                aria-label={t('account')}
            >
                <User className="size-5" strokeWidth={1.75} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href="/account/profile" />}>{t('profile')}</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/orders" />}>{t('orders')}</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/addresses" />}>{t('addresses')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<LoginButton isLoggedIn={true} />} nativeButton />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
