import sanitizeHtml from 'sanitize-html';

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

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
    a: ['href', 'title', 'target', 'rel'],
    span: ['class'],
    div: ['class'],
};

export function sanitizeProductDescription(html: string): string {
    if (!html) {
        return '';
    }

    return sanitizeHtml(html, {
        allowedTags: ALLOWED_TAGS,
        allowedAttributes: ALLOWED_ATTRIBUTES,
        allowedSchemes: ['http', 'https', 'mailto'],
    }).trim();
}
