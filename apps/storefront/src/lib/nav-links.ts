export type NavLinkKey =
    | 'newIn'
    | 'bras'
    | 'knickers'
    | 'lingerieSets'
    | 'bodies'
    | 'nightwear'
    | 'plusSize'
    | 'accessories'
    | 'sale';

export interface MainNavLink {
    key: NavLinkKey;
    href: string;
    highlight?: boolean;
}

export const MAIN_NAV_LINKS: MainNavLink[] = [
    {key: 'newIn', href: '/search?sort=newest'},
    {key: 'bras', href: '/search?q=bras'},
    {key: 'knickers', href: '/search?q=knickers'},
    {key: 'lingerieSets', href: '/search?q=lingerie+sets'},
    {key: 'bodies', href: '/search?q=bodies'},
    {key: 'nightwear', href: '/search?q=nightwear'},
    {key: 'plusSize', href: '/search?q=plus+size'},
    {key: 'accessories', href: '/search?q=accessories'},
    {key: 'sale', href: '/search?q=sale', highlight: true},
];
