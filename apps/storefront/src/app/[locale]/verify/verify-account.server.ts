import 'server-only';

import {mutate} from '@/lib/vendure/api';
import {VerifyCustomerAccountMutation} from '@/lib/vendure/mutations';
import {getTranslations} from 'next-intl/server';

export type VerifyAccountResult =
    | {success: true; authToken?: string}
    | {error: string};

export async function verifyCustomerAccount(
    token: string,
    password?: string,
): Promise<VerifyAccountResult> {
    const t = await getTranslations('Errors');

    if (!token) {
        return {error: t('verificationTokenRequired')};
    }

    try {
        const result = await mutate(VerifyCustomerAccountMutation, {
            token,
            password: password || undefined,
        });

        const verifyResult = result.data.verifyCustomerAccount;

        if (verifyResult.__typename === 'CurrentUser') {
            return {success: true, authToken: result.token};
        }

        return {error: verifyResult.message};
    } catch {
        return {error: t('unexpectedError')};
    }
}
