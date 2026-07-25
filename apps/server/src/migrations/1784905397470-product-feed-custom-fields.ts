import {MigrationInterface, QueryRunner} from "typeorm";

export class ProductFeedCustomFields1784905397470 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "product" ADD "customFieldsSourceproductcode" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "product" ADD "customFieldsMaterials" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "product" ADD "customFieldsPower" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "product" ADD "customFieldsSizeimperial" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "product" ADD "customFieldsLastseeninfeedat" TIMESTAMP(6)`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "customFieldsSourceuniqueid" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "customFieldsTradeprice" double precision`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "customFieldsBarcode" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "customFieldsMpn" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "customFieldsWeight" double precision`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "customFieldsLastseeninfeedat" TIMESTAMP(6)`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "customFieldsLastseeninfeedat"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "customFieldsWeight"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "customFieldsMpn"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "customFieldsBarcode"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "customFieldsTradeprice"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "customFieldsSourceuniqueid"`, undefined);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "customFieldsLastseeninfeedat"`, undefined);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "customFieldsSizeimperial"`, undefined);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "customFieldsPower"`, undefined);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "customFieldsMaterials"`, undefined);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "customFieldsSourceproductcode"`, undefined);
   }

}
