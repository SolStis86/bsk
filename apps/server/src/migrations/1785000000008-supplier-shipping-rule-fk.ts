import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns supplier_shipping_rule.providerId FK with TypeORM's expected constraint name
 * and ON UPDATE NO ACTION (migration 1785000000007 used a custom constraint name).
 */
export class SupplierShippingRuleFk1785000000008 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "supplier_shipping_rule"
            DROP CONSTRAINT IF EXISTS "FK_supplier_shipping_rule_provider"
        `);
        await queryRunner.query(`
            ALTER TABLE "supplier_shipping_rule"
            DROP CONSTRAINT IF EXISTS "FK_a703a2c4451f9e51f31f66e4b48"
        `);
        await queryRunner.query(`
            ALTER TABLE "supplier_shipping_rule"
            ADD CONSTRAINT "FK_a703a2c4451f9e51f31f66e4b48"
            FOREIGN KEY ("providerId") REFERENCES "product_supplier_provider"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "supplier_shipping_rule"
            DROP CONSTRAINT IF EXISTS "FK_a703a2c4451f9e51f31f66e4b48"
        `);
        await queryRunner.query(`
            ALTER TABLE "supplier_shipping_rule"
            ADD CONSTRAINT "FK_supplier_shipping_rule_provider"
            FOREIGN KEY ("providerId") REFERENCES "product_supplier_provider"("id")
            ON DELETE CASCADE
        `);
    }
}
