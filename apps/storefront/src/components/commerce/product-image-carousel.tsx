'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductImageCarouselProps {
    images: Array<{
        id: string;
        preview: string;
        source: string;
    }>;
}

export function ProductImageCarousel({ images }: ProductImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);
    const thumbScrollRef = useRef<HTMLDivElement>(null);

    const updateScrollState = useCallback(() => {
        const el = thumbScrollRef.current;
        if (!el) {
            setCanScrollUp(false);
            setCanScrollDown(false);
            return;
        }

        setCanScrollUp(el.scrollTop > 1);
        setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    }, []);

    useEffect(() => {
        updateScrollState();

        const el = thumbScrollRef.current;
        if (!el) return;

        el.addEventListener('scroll', updateScrollState, { passive: true });
        const observer = new ResizeObserver(updateScrollState);
        observer.observe(el);

        return () => {
            el.removeEventListener('scroll', updateScrollState);
            observer.disconnect();
        };
    }, [images.length, updateScrollState]);

    useEffect(() => {
        const el = thumbScrollRef.current;
        const thumb = el?.children[currentIndex] as HTMLElement | undefined;
        thumb?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [currentIndex]);

    if (!images || images.length === 0) {
        return (
            <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
                <span className="text-muted-foreground">No images available</span>
            </div>
        );
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const scrollThumbs = (direction: 'up' | 'down') => {
        const el = thumbScrollRef.current;
        if (!el) return;

        const thumb = el.querySelector('[data-thumb]') as HTMLElement | null;
        const gap = 8;
        const step = thumb ? thumb.offsetHeight + gap : 72;

        el.scrollBy({
            top: direction === 'up' ? -step : step,
            behavior: 'smooth',
        });
    };

    const hasMultipleImages = images.length > 1;
    const showThumbNav = hasMultipleImages && (canScrollUp || canScrollDown);

    return (
        <div className="flex gap-3">
            {/* Main Image */}
            <div className="relative min-w-0 flex-1 aspect-square bg-muted rounded-xl overflow-hidden group/main cursor-crosshair">
                <Image
                    src={images[currentIndex].source}
                    alt={`Product image ${currentIndex + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) calc(100vw - 5.5rem), 45vw"
                    priority={currentIndex === 0}
                />

                {hasMultipleImages && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-sm opacity-0 group-hover/main:opacity-100 transition-opacity rounded-full"
                            onClick={goToPrevious}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-sm opacity-0 group-hover/main:opacity-100 transition-opacity rounded-full"
                            onClick={goToNext}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </>
                )}
            </div>

            {/* Thumbnail column */}
            {hasMultipleImages && (
                <div className="group/thumbs relative flex w-[4.25rem] shrink-0 min-h-0 flex-col self-stretch sm:w-[4.75rem]">
                    {showThumbNav && canScrollUp && (
                        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center bg-gradient-to-b from-background/90 to-transparent pb-4 pt-0.5 opacity-0 transition-opacity group-hover/thumbs:opacity-100">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Scroll thumbnails up"
                                className="pointer-events-auto size-7 rounded-full bg-background/90 shadow-sm hover:bg-background"
                                onClick={() => scrollThumbs('up')}
                            >
                                <ChevronUp className="size-4" />
                            </Button>
                        </div>
                    )}

                    <div
                        ref={thumbScrollRef}
                        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {images.map((image, index) => (
                            <button
                                key={image.id}
                                type="button"
                                data-thumb
                                onClick={() => setCurrentIndex(index)}
                                aria-label={`View image ${index + 1}`}
                                aria-current={index === currentIndex ? 'true' : undefined}
                                className={cn(
                                    'relative aspect-square w-full shrink-0 rounded-md overflow-hidden border-2 transition-all duration-200',
                                    index === currentIndex
                                        ? 'border-brand-pink'
                                        : 'border-border/70 opacity-75 hover:opacity-100 hover:border-muted-foreground',
                                )}
                            >
                                <Image
                                    src={image.preview}
                                    alt={`Thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="76px"
                                />
                            </button>
                        ))}
                    </div>

                    {showThumbNav && canScrollDown && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center bg-gradient-to-t from-background/90 to-transparent pb-0.5 pt-4 opacity-0 transition-opacity group-hover/thumbs:opacity-100">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Scroll thumbnails down"
                                className="pointer-events-auto size-7 rounded-full bg-background/90 shadow-sm hover:bg-background"
                                onClick={() => scrollThumbs('down')}
                            >
                                <ChevronDown className="size-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
