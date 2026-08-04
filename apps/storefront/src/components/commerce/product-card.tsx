'use client';

import Image from 'next/image';
import { FragmentOf, readFragment } from '@/graphql';
import { ProductCardFragment } from '@/lib/vendure/fragments';
import { Price } from '@/components/commerce/price';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
    ProductCardAddToCartButton,
    ProductCardWishlistButton,
} from '@/components/commerce/product-card-actions';

interface ProductCardProps {
    product: FragmentOf<typeof ProductCardFragment>;
    wishlistItemId?: string | null;
    isAuthenticated?: boolean;
    onWishlistChange?: (variantId: string, itemId: string | null) => void;
}

export function ProductCard({
    product: productProp,
    wishlistItemId = null,
    isAuthenticated = false,
    onWishlistChange,
}: ProductCardProps) {
    const t = useTranslations('Product');
    const product = readFragment(ProductCardFragment, productProp);

    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-lg bg-card shadow-sm transition-shadow duration-300 hover:shadow-md">
            <div className="relative aspect-square overflow-hidden bg-muted">
                <Link href={`/product/${product.slug}`} className="block h-full w-full">
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
                </Link>
                <ProductCardAddToCartButton
                    variantId={product.productVariantId}
                    productName={product.productName}
                    inStock={product.inStock}
                />
            </div>

            <div className="flex flex-1 flex-col p-4">
                <Link href={`/product/${product.slug}`} className="block flex-1">
                    <h3 className="line-clamp-2 min-h-[2.75rem] font-sans font-medium leading-snug text-brand-charcoal transition-colors group-hover:text-brand-pink">
                        {product.productName}
                    </h3>
                </Link>

                <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-base font-semibold tracking-tight text-brand-charcoal">
                        {product.priceWithTax.__typename === 'PriceRange' ? (
                            product.priceWithTax.min !== product.priceWithTax.max ? (
                                <>
                                    <span className="mr-1 text-xs font-normal text-muted-foreground">
                                        {t('from')}
                                    </span>
                                    <Price
                                        value={product.priceWithTax.min}
                                        currencyCode={product.currencyCode}
                                    />
                                </>
                            ) : (
                                <Price
                                    value={product.priceWithTax.min}
                                    currencyCode={product.currencyCode}
                                />
                            )
                        ) : product.priceWithTax.__typename === 'SinglePrice' ? (
                            <Price
                                value={product.priceWithTax.value}
                                currencyCode={product.currencyCode}
                            />
                        ) : null}
                    </p>

                    <ProductCardWishlistButton
                        variantId={product.productVariantId}
                        productSlug={product.slug}
                        wishlistItemId={wishlistItemId}
                        isAuthenticated={isAuthenticated}
                        onWishlistChange={onWishlistChange}
                    />
                </div>
            </div>
        </article>
    );
}
