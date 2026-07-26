import type {Metadata} from 'next';
import {Suspense} from 'react';
import {cacheLife} from 'next/cache';
import {getActiveCustomer} from '@/lib/vendure/actions';
import {ChangePasswordForm} from './change-password-form';
import {EditProfileForm} from './edit-profile-form';
import {EditEmailForm} from './edit-email-form';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import ProfileLoading from './loading';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Account'});
    return {
        title: t('profilePageTitle'),
    };
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<ProfileLoading />}>
            <ProfileContent />
        </Suspense>
    );
}

async function ProfileContent() {
    'use cache: private';
    cacheLife('minutes');

    const customer = await getActiveCustomer();
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Account'});

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('profile')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('manageAccountInfo')}
                </p>
            </div>

            <EditProfileForm customer={customer} />

            <EditEmailForm currentEmail={customer?.emailAddress || ''} />

            <ChangePasswordForm />
        </div>
    );
}
