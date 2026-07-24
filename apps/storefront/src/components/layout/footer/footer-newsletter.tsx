'use client';

import {useActionState} from 'react';
import {Mail} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {subscribeNewsletter} from '@/components/layout/footer/actions';

function NewsletterDecor() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 32"
            className="hidden lg:block h-8 w-6 shrink-0 text-white/90"
            fill="none"
        >
            <path d="M4 2 L20 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 12 L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 22 L20 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function FooterNewsletter() {
    const t = useTranslations('Footer');
    const [state, formAction, isPending] = useActionState(
        async (_prev: {success?: boolean; error?: string} | null, formData: FormData) => {
            return subscribeNewsletter(formData);
        },
        null,
    );

    return (
        <section className="bg-brand-pink text-white">
            <div className="container mx-auto px-4 py-8 md:py-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4 max-w-xl">
                        <Mail className="size-8 shrink-0 mt-0.5" strokeWidth={1.5} />
                        <div>
                            <h2 className="text-lg md:text-xl font-bold uppercase tracking-[0.08em]">
                                {t('newsletter.title')}
                            </h2>
                            <p className="mt-2 text-sm md:text-base text-white/90 leading-relaxed">
                                {t('newsletter.description')}
                            </p>
                        </div>
                    </div>

                    <form action={formAction} className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center lg:max-w-none lg:w-auto">
                        <Input
                            type="email"
                            name="email"
                            required
                            placeholder={t('newsletter.placeholder')}
                            aria-label={t('newsletter.placeholder')}
                            className="h-11 flex-1 min-w-[220px] border-0 bg-white text-brand-charcoal placeholder:text-neutral-400 shadow-none focus-visible:ring-2 focus-visible:ring-white/40"
                        />
                        <div className="flex items-center gap-3">
                            <Button
                                type="submit"
                                disabled={isPending}
                                variant="brand-dark"
                                size="brand"
                                className="min-w-[140px] rounded-sm"
                            >
                                {isPending ? t('newsletter.submitting') : t('newsletter.submit')}
                            </Button>
                            <NewsletterDecor />
                        </div>
                    </form>
                </div>

                {state?.success && (
                    <p className="mt-4 text-sm text-white/95">{t('newsletter.success')}</p>
                )}
                {state?.error === 'invalidEmail' && (
                    <p className="mt-4 text-sm text-white">{t('newsletter.invalidEmail')}</p>
                )}
            </div>
        </section>
    );
}
