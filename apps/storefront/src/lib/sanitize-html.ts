import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'a',
    'span',
    'div',
];

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'class'];

export function sanitizeProductDescription(html: string): string {
    if (!html) {
        return '';
    }

    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
    }).trim();
}
