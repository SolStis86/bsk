import {MigrationInterface, QueryRunner} from 'typeorm';

export class ProductFeedImportProgress1785000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "product_feed_import_progress_record" (
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "jobId" character varying NOT NULL,
                "stage" character varying NOT NULL,
                "message" character varying NOT NULL,
                "progress" double precision NOT NULL,
                "processedProducts" integer NOT NULL DEFAULT 0,
                "totalProducts" integer NOT NULL DEFAULT 0,
                "currentProductCode" character varying,
                "result" json,
                "error" character varying,
                "id" SERIAL NOT NULL,
                CONSTRAINT "PK_product_feed_import_progress_record" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_product_feed_import_progress_job_id" UNIQUE ("jobId")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "product_feed_import_progress_record"`);
    }
}
