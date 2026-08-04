import Image from 'next/image';
import { getRouteLocale } from '@/i18n/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getHomepageCategories } from '@/lib/vendure/cached';

export async function HomepageCategories() {
    const locale = await getRouteLocale();
    const [categories, t] = await Promise.all([
        getHomepageCategories(locale),
        getTranslations({ locale, namespace: 'Home' }),
    ]);

    if (categories.length === 0) {
        return null;
    }

    return (
        <section className="bg-white py-10 md:py-12" aria-labelledby="homepage-categories-heading">
            <div className="container mx-auto px-4">
                <h2
                    id="homepage-categories-heading"
                    className="mb-6 text-center font-heading text-xl font-bold tracking-tight text-brand-charcoal md:mb-8 md:text-2xl"
                >
                    {t('shopByCategory')}
                </h2>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-5">
                    {categories.map((category) => (
                        <Link
                            key={category.slug}
                            href={`/collection/${category.slug}`}
                            className="group flex flex-col items-center text-center"
                        >
                            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted shadow-sm transition-shadow duration-300 group-hover:shadow-md">
                                {category.imagePreview ? (
                                    <Image
                                        src={category.imagePreview}
                                        alt={category.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center px-3 text-sm font-medium text-muted-foreground">
                                        {category.name}
                                    </div>
                                )}
                            </div>
                            <span className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-brand-charcoal transition-colors group-hover:text-brand-pink">
                                {category.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
