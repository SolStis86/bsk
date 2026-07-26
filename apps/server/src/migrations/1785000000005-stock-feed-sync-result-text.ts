import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * TypeORM `simple-json` columns use `text` on Postgres, not native `json`.
 * The initial stock feed migration incorrectly used `json`.
 */
export class StockFeedSyncResultText1785000000005 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "stock_feed_sync_run_record"
            ALTER COLUMN "result" TYPE text USING "result"::text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "stock_feed_sync_run_record"
            ALTER COLUMN "result" TYPE json USING "result"::json
        `);
    }
}
