export type FooterHelpLinkKey =
    | 'helpFaqs'
    | 'deliveryInfo'
    | 'returnsRefunds'
    | 'sizeGuide'
    | 'contactUs';

export type FooterAboutLinkKey =
    | 'aboutUs'
    | 'ourBlog'
    | 'giftCards'
    | 'studentDiscount'
    | 'ambassadorProgram';

export interface FooterLink {
    key: string;
    href: string;
}

export const FOOTER_HELP_LINKS: FooterLink[] = [
    {key: 'helpFaqs', href: '/search?q=help'},
    {key: 'deliveryInfo', href: '/search?q=delivery'},
    {key: 'returnsRefunds', href: '/search?q=returns'},
    {key: 'sizeGuide', href: '/search?q=size+guide'},
    {key: 'contactUs', href: '/search?q=contact'},
];

export const FOOTER_ABOUT_LINKS: FooterLink[] = [
    {key: 'aboutUs', href: '/search?q=about'},
    {key: 'ourBlog', href: '/search?q=blog'},
    {key: 'giftCards', href: '/search?q=gift+cards'},
    {key: 'studentDiscount', href: '/search?q=student+discount'},
    {key: 'ambassadorProgram', href: '/search?q=ambassador'},
];

export const FOOTER_SOCIAL_LINKS = [
    {key: 'instagram', href: 'https://instagram.com', label: 'Instagram'},
    {key: 'tiktok', href: 'https://tiktok.com', label: 'TikTok'},
    {key: 'facebook', href: 'https://facebook.com', label: 'Facebook'},
    {key: 'pinterest', href: 'https://pinterest.com', label: 'Pinterest'},
] as const;
