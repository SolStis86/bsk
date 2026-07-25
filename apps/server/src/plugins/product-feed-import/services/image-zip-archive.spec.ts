import path from 'path';

import { describe, expect, it } from 'vitest';

import { ImageZipArchive, normalizeFilename } from './image-zip-archive';

const fixturesDir = path.join(__dirname, '../__fixtures__');

describe('ImageZipArchive', () => {
    it('indexes zip entries by basename case-insensitively', async () => {
        const archive = await ImageZipArchive.fromPath(path.join(fixturesDir, 'images.zip'));

        expect(archive.entryCount).toBe(1);
        expect(archive.hasFilename('test-product.jpg')).toBe(true);
        expect(archive.hasFilename('TEST-PRODUCT.JPG')).toBe(true);
        expect(archive.hasFilename('missing.jpg')).toBe(false);

        const stream = await archive.openStream('test-product.jpg');
        expect(stream).not.toBeNull();

        await archive.close();
    });

    it('normalises filenames to lowercase basenames', () => {
        expect(normalizeFilename('folder/Photo.JPG')).toBe('photo.jpg');
    });
});
