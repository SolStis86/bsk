export function isVendureBuildFetchSkipped(): boolean {
    return process.env.SKIP_VENDURE_BUILD_FETCH === 'true';
}

/** Placeholder slug used only to satisfy Next.js build-time static param validation. */
export const BUILD_PLACEHOLDER_SLUG = '__build__';
