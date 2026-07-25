import createMiddleware from 'next-intl/middleware';
import {NextRequest} from 'next/server';
import {routing} from './i18n/routing';

const middleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', request.nextUrl.pathname);

    return middleware(
        new NextRequest(request.url, {
            headers: requestHeaders,
            method: request.method,
        }),
    );
}

export const config = {matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']};
