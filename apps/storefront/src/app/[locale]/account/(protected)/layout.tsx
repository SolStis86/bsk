import {Suspense} from 'react';
import {requireAuthenticatedCustomer} from '@/lib/auth/require-authenticated-customer';

async function AuthenticatedAccountGate({children}: {children: React.ReactNode}) {
    await requireAuthenticatedCustomer();
    return children;
}

export default function ProtectedAccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={null}>
            <AuthenticatedAccountGate>{children}</AuthenticatedAccountGate>
        </Suspense>
    );
}
