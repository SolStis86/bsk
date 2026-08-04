import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';

import { getImportZipPath } from '../constants/import-session.constants';
import { ImageZipArchive } from './image-zip-archive';

@Injectable()
export class ProductFeedImportAssetSessionService {
    private archive: ImageZipArchive | null = null;
    private importJobId: string | null = null;

    isActive(): boolean {
        return this.archive != null;
    }

    getImportJobId(): string | null {
        return this.importJobId;
    }

    async activate(importJobId: string, zipPath?: string): Promise<void> {
        await this.deactivate();
        const resolvedPath = zipPath ?? getImportZipPath(importJobId);
        this.archive = await ImageZipArchive.fromPath(resolvedPath);
        this.importJobId = importJobId;
    }

    async activateFromPath(zipPath: string, importJobId = 'local'): Promise<void> {
        await this.activate(importJobId, zipPath);
    }

    async openStream(filename: string): Promise<Readable | null> {
        if (!this.archive) {
            return null;
        }

        return this.archive.openStream(filename);
    }

    get entryCount(): number {
        return this.archive?.entryCount ?? 0;
    }

    async deactivate(): Promise<void> {
        if (this.archive) {
            await this.archive.close();
            this.archive = null;
        }
        this.importJobId = null;
    }
}
