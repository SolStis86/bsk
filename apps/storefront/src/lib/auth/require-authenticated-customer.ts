import 'server-only';

import {headers} from 'next/headers';
import {redirect} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {getRouteLocale} from '@/i18n/server';
import {getAuthToken} from '@/lib/auth';
import {query} from '@/lib/vendure/api';
import {GetActiveCustomerQuery} from '@/lib/vendure/queries';

function getReturnPath(pathname: string): string | undefined {
    for (const locale of routing.locales) {
        const prefix = `/${locale}`;
        if (pathname === prefix) {
            return '/';
        }
        if (pathname.startsWith(`${prefix}/`)) {
            return pathname.slice(prefix.length);
        }
    }

    return pathname.startsWith('/') ? pathname : undefined;
}

/**
 * Redirects to sign-in when there is no authenticated customer session.
 * Use in account layouts/pages that require a logged-in user.
 */
export async function requireAuthenticatedCustomer(returnTo?: string): Promise<void> {
    const locale = await getRouteLocale();
    const token = await getAuthToken();

    const headersList = await headers();
    const pathname = headersList.get('x-pathname');
    const resolvedReturnTo =
        returnTo ??
        (pathname ? getReturnPath(pathname) : undefined);

    const signInHref =
        resolvedReturnTo &&
        resolvedReturnTo.startsWith('/') &&
        !resolvedReturnTo.startsWith('//')
            ? `/sign-in?redirectTo=${encodeURIComponent(resolvedReturnTo)}`
            : '/sign-in';

    if (!token) {
        redirect({href: signInHref, locale});
    }

    const {data} = await query(GetActiveCustomerQuery, undefined, {token});

    if (!data.activeCustomer) {
        redirect({href: signInHref, locale});
    }
}
