import {FOOTER_SOCIAL_LINKS} from '@/lib/footer-links';
import {cn} from '@/lib/utils';

function InstagramIcon({className}: {className?: string}) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
    );
}

function TikTokIcon({className}: {className?: string}) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.69V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-1.1-.48z" />
        </svg>
    );
}

function FacebookIcon({className}: {className?: string}) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M13.5 8.5V6.8c0-.6.4-1 .9-1H16V3h-2.4C11.8 3 10.5 4.5 10.5 6.6V8.5H8v2.7h2.5V21h3V11.2h2.6l.4-2.7H13.5z" />
        </svg>
    );
}

function PinterestIcon({className}: {className?: string}) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M12 3a9 9 0 0 0-3.17 17.45c-.08-.72-.15-1.82.03-2.6.17-.72 1.08-4.58 1.08-4.58s-.27-.54-.27-1.34c0-1.25.73-2.19 1.63-2.19.77 0 1.14.58 1.14 1.27 0 .77-.49 1.93-.75 3-.21.9.45 1.63 1.33 1.63 1.6 0 2.83-1.69 2.83-4.13 0-2.16-1.55-3.67-3.77-3.67-2.57 0-4.08 1.93-4.08 3.92 0 .77.3 1.6.67 2.05.07.09.08.16.06.25l-.24 1c-.04.16-.13.2-.3.12-1.12-.52-1.82-2.17-1.82-3.5 0-2.85 2.07-5.47 5.98-5.47 3.14 0 5.58 2.24 5.58 5.23 0 3.12-1.97 5.63-4.71 5.63-.92 0-1.78-.48-2.08-1.05l-.57 2.17c-.21.8-.77 1.8-1.15 2.41A9 9 0 1 0 12 3z" />
        </svg>
    );
}

const iconMap = {
    instagram: InstagramIcon,
    tiktok: TikTokIcon,
    facebook: FacebookIcon,
    pinterest: PinterestIcon,
} as const;

interface FooterSocialLinksProps {
    className?: string;
}

export function FooterSocialLinks({className}: FooterSocialLinksProps) {
    return (
        <div className={cn('flex items-center gap-4', className)}>
            {FOOTER_SOCIAL_LINKS.map(({key, href, label}) => {
                const Icon = iconMap[key];
                return (
                    <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="text-brand-charcoal transition-colors hover:text-brand-pink"
                    >
                        <Icon className="size-5" />
                    </a>
                );
            })}
        </div>
    );
}
