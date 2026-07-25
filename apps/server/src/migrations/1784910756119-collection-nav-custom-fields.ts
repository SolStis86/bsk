import {MigrationInterface, QueryRunner} from "typeorm";

export class CollectionNavCustomFields1784910756119 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsShowinmainnav" boolean DEFAULT false`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsNavsortorder" integer DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsNavhighlight" boolean DEFAULT false`, undefined);

        const navDefaults: Array<{ slug: string; sortOrder: number; highlight: boolean }> = [
            { slug: 'new-in', sortOrder: 10, highlight: false },
            { slug: 'sexy-lingerie', sortOrder: 20, highlight: false },
            { slug: 'toys-for-her', sortOrder: 30, highlight: false },
            { slug: 'toys-for-him', sortOrder: 40, highlight: false },
            { slug: 'vibrators', sortOrder: 50, highlight: false },
            { slug: 'essentials', sortOrder: 60, highlight: false },
            { slug: 'offers', sortOrder: 70, highlight: true },
            { slug: 'best-sellers', sortOrder: 80, highlight: false },
            { slug: 'couples', sortOrder: 90, highlight: false },
        ];

        for (const { slug, sortOrder, highlight } of navDefaults) {
            await queryRunner.query(
                `UPDATE "collection" c
                 SET "customFieldsShowinmainnav" = true,
                     "customFieldsNavsortorder" = $1,
                     "customFieldsNavhighlight" = $2
                 FROM "collection_translation" ct
                 WHERE ct."baseId" = c.id AND ct.slug = $3`,
                [sortOrder, highlight, slug],
            );
        }
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsNavhighlight"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsNavsortorder"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsShowinmainnav"`, undefined);
   }

}
