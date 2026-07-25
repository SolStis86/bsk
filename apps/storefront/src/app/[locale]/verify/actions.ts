'use server';

import {setAuthToken} from '@/lib/auth';
import {verifyCustomerAccount} from './verify-account.server';

/**
 * Server action for form-based verification (supports optional password).
 * Cookie writes are allowed here because this runs as a submitted action.
 */
export async function verifyAccountAction(token: string, password?: string) {
    const result = await verifyCustomerAccount(token, password);

    if (!('success' in result)) {
        return result;
    }

    if (result.authToken) {
        await setAuthToken(result.authToken);
    }

    return {success: true as const};
}
