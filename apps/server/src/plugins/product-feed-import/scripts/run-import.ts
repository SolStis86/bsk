import 'dotenv/config';

import { bootstrap, RequestContextService } from '@vendure/core';

import { ProductFeedImportService } from '../services/product-feed-import.service';
import { config } from '../../../vendure-config';

function parseArgs(argv: string[]): {
    fixturePath?: string;
    importLimit?: number;
    imageZipPath?: string;
} {
    const options: {
        fixturePath?: string;
        importLimit?: number;
        imageZipPath?: string;
    } = {};

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--fixture' && argv[i + 1]) {
            options.fixturePath = argv[++i];
        } else if (arg === '--limit' && argv[i + 1]) {
            options.importLimit = parseInt(argv[++i], 10);
        } else if (arg === '--image-zip' && argv[i + 1]) {
            options.imageZipPath = argv[++i];
        }
    }

    return options;
}

async function run(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));
    const app = await bootstrap(config);

    try {
        const importService = app.get(ProductFeedImportService);
        const requestContextService = app.get(RequestContextService);
        const ctx = await requestContextService.create({ apiType: 'admin' });

        console.log('Starting product feed import...');
        if (options.fixturePath) {
            console.log(`Using fixture: ${options.fixturePath}`);
        }
        if (options.importLimit) {
            console.log(`Import limit: ${options.importLimit}`);
        }
        if (options.imageZipPath) {
            console.log(`Using image zip: ${options.imageZipPath}`);
        }

        const result = await importService.import(ctx, {
            fixturePath: options.fixturePath,
            importLimit: options.importLimit,
            imageZipPath: options.imageZipPath,
        });

        console.log('\nImport complete:');
        console.log(`  Products created: ${result.productsCreated}`);
        console.log(`  Products updated: ${result.productsUpdated}`);
        console.log(`  Variants created: ${result.variantsCreated}`);
        console.log(`  Variants updated: ${result.variantsUpdated}`);
        console.log(`  Assets imported: ${result.assetsImported}`);

        if (result.warnings.length) {
            console.log(`\nWarnings (${result.warnings.length}):`);
            result.warnings.slice(0, 20).forEach(w => console.log(`  - ${w}`));
            if (result.warnings.length > 20) {
                console.log(`  ... and ${result.warnings.length - 20} more`);
            }
        }

        if (result.errors.length) {
            console.log(`\nErrors (${result.errors.length}):`);
            result.errors.forEach(e => console.log(`  - ${e}`));
            process.exitCode = 1;
        }
    } finally {
        await app.close();
    }
}

run().catch(error => {
    console.error(error);
    process.exit(1);
});
