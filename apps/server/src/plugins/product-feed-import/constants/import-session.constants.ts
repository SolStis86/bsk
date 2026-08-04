import os from 'os';
import path from 'path';

export const IMPORT_SESSION_DIR = 'product-feed-import';

/** Root directory for per-import zip files (must be shared when server and worker run in separate containers). */
export function getImportSessionRoot(): string {
    const configured = process.env.PRODUCT_FEED_IMPORT_SESSION_DIR?.trim();
    return configured || os.tmpdir();
}

export function getImportZipPath(importJobId: string): string {
    return path.join(getImportSessionRoot(), IMPORT_SESSION_DIR, importJobId, 'images.zip');
}

export function getImportDir(importJobId: string): string {
    return path.join(getImportSessionRoot(), IMPORT_SESSION_DIR, importJobId);
}
