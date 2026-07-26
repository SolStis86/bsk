import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductEconomicsProviders1785000000007 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "product_supplier_provider" (
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "code" character varying NOT NULL,
                "name" character varying NOT NULL,
                "tradePriceIncludesVat" boolean NOT NULL DEFAULT false,
                "defaultVatRatePercent" double precision NOT NULL DEFAULT 20,
                "active" boolean NOT NULL DEFAULT true,
                "id" SERIAL NOT NULL,
                CONSTRAINT "PK_product_supplier_provider" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_product_supplier_provider_code" UNIQUE ("code")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "supplier_shipping_rule" (
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "providerId" integer NOT NULL,
                "code" character varying NOT NULL,
                "name" character varying NOT NULL,
                "costExVat" double precision NOT NULL,
                "isDefault" boolean NOT NULL DEFAULT false,
                "sortOrder" integer NOT NULL DEFAULT 0,
                "customerShippingMethodCode" character varying,
                "id" SERIAL NOT NULL,
                CONSTRAINT "PK_supplier_shipping_rule" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "supplier_shipping_rule"
            ADD CONSTRAINT "FK_a703a2c4451f9e51f31f66e4b48"
            FOREIGN KEY ("providerId") REFERENCES "product_supplier_provider"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "supplier_shipping_rule"`);
        await queryRunner.query(`DROP TABLE "product_supplier_provider"`);
    }
}
