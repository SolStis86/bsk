import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';

import unzipper from 'unzipper';

type ZipDirectory = Awaited<ReturnType<typeof unzipper.Open.file>>;
type ZipFileEntry = ZipDirectory['files'][number];

/**
 * Read-only view of the 1on1wholesale product image zip.
 * Indexes entries by basename (case-insensitive) for feed filename lookup.
 */
export class ImageZipArchive {
    private constructor(
        private readonly zipPath: string,
        private readonly deleteOnClose: boolean,
        private readonly index: Map<string, ZipFileEntry>,
    ) {}

    static async fromPath(zipPath: string): Promise<ImageZipArchive> {
        const directory = await unzipper.Open.file(zipPath);
        return new ImageZipArchive(zipPath, false, buildIndex(directory));
    }

    static async fromUrl(url: string): Promise<ImageZipArchive> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image zip: HTTP ${response.status}`);
        }

        const tempPath = path.join(os.tmpdir(), `product-feed-images-${Date.now()}.zip`);
        const arrayBuffer = await response.arrayBuffer();
        await fs.writeFile(tempPath, Buffer.from(arrayBuffer));

        const directory = await unzipper.Open.file(tempPath);
        return new ImageZipArchive(tempPath, true, buildIndex(directory));
    }

    get entryCount(): number {
        return this.index.size;
    }

    hasFilename(filename: string): boolean {
        return this.index.has(normalizeFilename(filename));
    }

    async openStream(filename: string): Promise<Readable | null> {
        const entry = this.index.get(normalizeFilename(filename));
        if (!entry) {
            return null;
        }

        return entry.stream();
    }

    async close(): Promise<void> {
        if (this.deleteOnClose) {
            await fs.unlink(this.zipPath).catch(() => undefined);
        }
    }
}

function buildIndex(directory: ZipDirectory): Map<string, ZipFileEntry> {
    const index = new Map<string, ZipFileEntry>();

    for (const file of directory.files) {
        if (file.type !== 'File') {
            continue;
        }

        const key = normalizeFilename(file.path);
        if (!index.has(key)) {
            index.set(key, file);
        }
    }

    return index;
}

export function normalizeFilename(filename: string): string {
    return path.basename(filename.trim()).toLowerCase();
}
