import { bootstrap, runMigrations } from '@vendure/core';
import { productTableExists, synchronizeSchemaAndStampMigrations } from './db-bootstrap';
import { config } from './vendure-config';

async function start() {
    const shouldSynchronize = process.env.DB_SYNCHRONIZE === 'true';

    if (shouldSynchronize) {
        console.log(
            'DB_SYNCHRONIZE=true: creating schema on empty database and stamping existing migrations…',
        );
        await synchronizeSchemaAndStampMigrations(config);
        await bootstrap(config);
        return;
    }

    if (!(await productTableExists(config))) {
        console.error(
            [
                'Database has no Vendure schema (relation "product" does not exist).',
                'On an empty database, set DB_SYNCHRONIZE=true for one server startup, then remove it.',
                'See deploy/FIRST_TIME_DATABASE.md',
            ].join('\n'),
        );
        process.exit(1);
    }

    await runMigrations(config);
    if (process.exitCode === 1) {
        process.exit(1);
    }

    await bootstrap(config);
}

start().catch(err => {
    console.error(err);
    process.exit(1);
});
