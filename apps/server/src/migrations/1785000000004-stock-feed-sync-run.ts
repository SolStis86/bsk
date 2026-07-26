import {MigrationInterface, QueryRunner} from 'typeorm';

export class StockFeedSyncRun1785000000004 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "stock_feed_sync_run_record" (
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "runId" character varying NOT NULL,
                "status" character varying NOT NULL,
                "source" character varying NOT NULL,
                "message" character varying NOT NULL,
                "startedAt" character varying NOT NULL,
                "completedAt" character varying,
                "durationMs" integer,
                "result" text,
                "error" character varying,
                "id" SERIAL NOT NULL,
                CONSTRAINT "PK_stock_feed_sync_run_record" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_stock_feed_sync_run_run_id" UNIQUE ("runId")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "stock_feed_sync_run_record"`);
    }
}
