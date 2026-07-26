import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductEconomicsFoundation1785000000006 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "product" ADD "customFieldsSupplierprovidercode" character varying(255) DEFAULT '1on1'`,
        );
        await queryRunner.query(
            `ALTER TABLE "global_settings" ADD "customFieldsProfitcalculationvatmode" character varying(255) DEFAULT 'net'`,
        );
        await queryRunner.query(`ALTER TABLE "order" ADD "customFieldsProfitsnapshot" text`);
        await queryRunner.query(`UPDATE "channel" SET "pricesIncludeTax" = true WHERE "pricesIncludeTax" = false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customFieldsProfitsnapshot"`);
        await queryRunner.query(
            `ALTER TABLE "global_settings" DROP COLUMN "customFieldsProfitcalculationvatmode"`,
        );
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "customFieldsSupplierprovidercode"`);
    }
}
