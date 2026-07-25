import {MigrationInterface, QueryRunner} from 'typeorm';

export class ProductFeedImportProgressPhase51785000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "product_feed_import_progress_record"
            ADD COLUMN IF NOT EXISTS "assetsPending" integer NOT NULL DEFAULT 0
        `);
        await queryRunner.query(`
            ALTER TABLE "product_feed_import_progress_record"
            ADD COLUMN IF NOT EXISTS "source" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "product_feed_import_progress_record"
            ADD COLUMN IF NOT EXISTS "startedAt" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "product_feed_import_progress_record"
            ADD COLUMN IF NOT EXISTS "completedAt" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "product_feed_import_progress_record"
            ADD COLUMN IF NOT EXISTS "durationMs" integer
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "product_feed_import_progress_record" DROP COLUMN IF EXISTS "durationMs"
        `);
        await queryRunner.query(`
            ALTER TABLE "product_feed_import_progress_record" DROP COLUMN IF EXISTS "completedAt"
        `);
        await queryRunner.query(`
            ALTER TABLE "product_feed_import_progress_record" DROP COLUMN IF EXISTS "startedAt"
        `);
        await queryRunner.query(`
            ALTER TABLE "product_feed_import_progress_record" DROP COLUMN IF EXISTS "source"
        `);
        await queryRunner.query(`
            ALTER TABLE "product_feed_import_progress_record" DROP COLUMN IF EXISTS "assetsPending"
        `);
    }
}
