import {MigrationInterface, QueryRunner} from "typeorm";

export class AddStripeCustomerId1785092334925 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "customer" RENAME COLUMN "customFields__fix_relational_custom_fields__" TO "customFieldsStripecustomerid"`, undefined);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "customFieldsStripecustomerid"`, undefined);
        await queryRunner.query(`ALTER TABLE "customer" ADD "customFieldsStripecustomerid" character varying(255)`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "customFieldsStripecustomerid"`, undefined);
        await queryRunner.query(`ALTER TABLE "customer" ADD "customFieldsStripecustomerid" boolean`, undefined);
        await queryRunner.query(`ALTER TABLE "customer" RENAME COLUMN "customFieldsStripecustomerid" TO "customFields__fix_relational_custom_fields__"`, undefined);
   }

}
