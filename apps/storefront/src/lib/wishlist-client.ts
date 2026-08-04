export const WISHLIST_COUNT_CHANGE_EVENT = 'wishlist-count-change';

export function emitWishlistCountChange(delta: number) {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(
        new CustomEvent<{ delta: number }>(WISHLIST_COUNT_CHANGE_EVENT, {
            detail: { delta },
        }),
    );
}
