import {MigrationInterface, QueryRunner} from 'typeorm';

export class EnabledCategoryTags1785000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "global_settings" ADD "customFieldsEnabledcategorytags" text`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "global_settings" DROP COLUMN "customFieldsEnabledcategorytags"`,
        );
    }
}
