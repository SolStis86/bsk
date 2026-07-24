'use server';

import {z} from 'zod';

const emailSchema = z.string().email();

export async function subscribeNewsletter(formData: FormData) {
    const email = formData.get('email');

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
        return {success: false as const, error: 'invalidEmail' as const};
    }

    // Newsletter integration can be wired to a provider or Vendure plugin later.
    return {success: true as const};
}
