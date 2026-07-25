import {MigrationInterface, QueryRunner} from 'typeorm';

export class EnabledParentCategorySlugs1785000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "global_settings" ADD "customFieldsEnabledparentcategoryslugs" text`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "global_settings" DROP COLUMN "customFieldsEnabledparentcategoryslugs"`,
        );
    }
}
