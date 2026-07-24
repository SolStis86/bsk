import Image from 'next/image';
import {Suspense} from 'react';
import {NavigationLink} from '@/components/shared/navigation-link';
import {PromoBar} from '@/components/layout/promo-bar';
import {NavbarNavLinks} from '@/components/layout/navbar/navbar-nav-links';
import {NavbarCart} from '@/components/layout/navbar/navbar-cart';
import {NavbarAccountIcon} from '@/components/layout/navbar/navbar-account-icon';
import {NavbarSearchIcon} from '@/components/layout/navbar/navbar-search-icon';
import {NavbarWishlistIcon} from '@/components/layout/navbar/navbar-wishlist-icon';
import {MobileNavWrapper} from '@/components/layout/navbar/mobile-nav-wrapper';
import {NavbarUserSkeleton} from '@/components/shared/skeletons/navbar-user-skeleton';

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 bg-white">
            <PromoBar />
            <div className="border-b border-border/40">
                <div className="container mx-auto px-4">
                    <div className="relative flex items-center justify-between gap-4 h-[72px] md:h-20">
                        <div className="flex items-center gap-3 shrink-0">
                            <Suspense>
                                <MobileNavWrapper />
                            </Suspense>
                            <NavigationLink href="/" className="block shrink-0">
                                <Image
                                    src="/logo-small.png"
                                    alt="BuySome Knickers"
                                    width={148}
                                    height={52}
                                    className="h-10 w-auto md:h-11"
                                    priority
                                />
                            </NavigationLink>
                        </div>

                        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 xl:block">
                            <Suspense>
                                <NavbarNavLinks />
                            </Suspense>
                        </div>

                        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                            <NavbarSearchIcon />
                            <Suspense fallback={<NavbarUserSkeleton />}>
                                <NavbarAccountIcon />
                            </Suspense>
                            <NavbarWishlistIcon />
                            <Suspense>
                                <NavbarCart />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
