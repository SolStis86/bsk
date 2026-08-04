import { readdirSync } from 'fs';
import path from 'path';
import { createConnection } from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import type { VendureConfig } from '@vendure/core';

function migrationNameFromFilename(filename: string): { timestamp: number; name: string } | null {
    const match = filename.match(/^(\d+)-(.+)\.(js|ts)$/);
    if (!match) {
        return null;
    }
    return {
        timestamp: Number(match[1]),
        name: `${camelCase(match[2], true)}${match[1]}`,
    };
}

async function ensureMigrationsTable(query: (sql: string, params?: unknown[]) => Promise<unknown>) {
    await query(`
        CREATE TABLE IF NOT EXISTS "migrations" (
            "id" SERIAL NOT NULL,
            "timestamp" bigint NOT NULL,
            "name" character varying NOT NULL,
            CONSTRAINT "PK_migrations_id" PRIMARY KEY ("id")
        )
    `);
}

export async function productTableExists(config: VendureConfig): Promise<boolean> {
    const connection = await createConnection({
        ...config.dbConnectionOptions,
        synchronize: false,
        migrationsRun: false,
    });
    try {
        const schema =
            'schema' in config.dbConnectionOptions && config.dbConnectionOptions.schema
                ? config.dbConnectionOptions.schema
                : 'public';
        const result = await connection.query(`SELECT to_regclass($1) IS NOT NULL AS "exists"`, [
            `${schema}.product`,
        ]);
        return Boolean(result[0]?.exists);
    } finally {
        await connection.close();
    }
}

/**
 * Creates the full schema from entity metadata (synchronize) and records all
 * bundled migrations as already applied. Used once for an empty database when
 * no initial-schema migration is present in the repo.
 */
export async function synchronizeSchemaAndStampMigrations(config: VendureConfig): Promise<void> {
    const connection = await createConnection({
        ...config.dbConnectionOptions,
        synchronize: true,
        migrationsRun: false,
    });

    try {
        await ensureMigrationsTable((sql, params) => connection.query(sql, params));

        const migrationsDir = path.join(__dirname, 'migrations');
        const files = readdirSync(migrationsDir)
            .filter(file => /\.(js|ts)$/.test(file))
            .sort();

        const existing: Array<{ name: string }> = await connection.query(`SELECT "name" FROM "migrations"`);
        const executed = new Set(existing.map(row => row.name));

        for (const file of files) {
            const migration = migrationNameFromFilename(file);
            if (!migration || executed.has(migration.name)) {
                continue;
            }
            await connection.query(`INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)`, [
                migration.timestamp,
                migration.name,
            ]);
            console.log(`Stamped migration: ${migration.name}`);
        }
    } finally {
        await connection.close();
    }
}
