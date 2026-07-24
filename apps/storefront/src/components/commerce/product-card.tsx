import Image from 'next/image';
import {FragmentOf, readFragment} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {Price} from '@/components/commerce/price';
import {Suspense} from "react";
import { Link } from '@/i18n/navigation';
import {useTranslations} from 'next-intl';

interface ProductCardProps {
    product: FragmentOf<typeof ProductCardFragment>;
}

export function ProductCard({product: productProp}: ProductCardProps) {
    const t = useTranslations('Product');
    const product = readFragment(ProductCardFragment, productProp);

    return (
        <Link
            href={`/product/${product.slug}`}
            className="group block overflow-hidden rounded-lg bg-card shadow-sm transition-shadow duration-300 hover:shadow-md"
        >
            <div className="relative aspect-square overflow-hidden bg-muted">
                {product.productAsset ? (
                    <Image
                        src={product.productAsset.preview}
                        alt={product.productName}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        {t('noImage')}
                    </div>
                )}
            </div>
            <div className="space-y-2 p-4">
                <h3 className="line-clamp-2 font-sans font-medium leading-snug text-brand-charcoal transition-colors group-hover:text-brand-pink">
                    {product.productName}
                </h3>
                <Suspense fallback={<div className="h-8 w-36 rounded bg-muted"></div>}>
                    <p className="text-base font-semibold tracking-tight text-brand-charcoal">
                        {product.priceWithTax.__typename === 'PriceRange' ? (
                            product.priceWithTax.min !== product.priceWithTax.max ? (
                                <>
                                    <span className="mr-1 text-xs font-normal text-muted-foreground">{t('from')}</span>
                                    <Price value={product.priceWithTax.min} currencyCode={product.currencyCode}/>
                                </>
                            ) : (
                                <Price value={product.priceWithTax.min} currencyCode={product.currencyCode}/>
                            )
                        ) : product.priceWithTax.__typename === 'SinglePrice' ? (
                            <Price value={product.priceWithTax.value} currencyCode={product.currencyCode}/>
                        ) : null}
                    </p>
                </Suspense>
            </div>
        </Link>
    );
}
