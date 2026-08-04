import {MigrationInterface, QueryRunner} from 'typeorm';

export class CollectionHomepageCustomFields1785124800000 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsShowonhomepage" boolean DEFAULT false`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsHomepagesortorder" integer DEFAULT '0'`, undefined);

        const homepageDefaults: Array<{ slug: string; sortOrder: number }> = [
            { slug: 'sexy-lingerie', sortOrder: 10 },
            { slug: 'toys-for-her', sortOrder: 20 },
            { slug: 'toys-for-him', sortOrder: 30 },
            { slug: 'vibrators', sortOrder: 40 },
            { slug: 'essentials', sortOrder: 50 },
            { slug: 'couples', sortOrder: 60 },
            { slug: 'new-in', sortOrder: 70 },
            { slug: 'best-sellers', sortOrder: 80 },
        ];

        for (const { slug, sortOrder } of homepageDefaults) {
            await queryRunner.query(
                `UPDATE "collection" c
                 SET "customFieldsShowonhomepage" = true,
                     "customFieldsHomepagesortorder" = $1
                 FROM "collection_translation" ct
                 WHERE ct."baseId" = c.id AND ct.slug = $2`,
                [sortOrder, slug],
            );
        }
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsHomepagesortorder"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsShowonhomepage"`, undefined);
   }

}
