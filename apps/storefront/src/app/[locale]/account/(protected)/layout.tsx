import {requireAuthenticatedCustomer} from '@/lib/auth/require-authenticated-customer';

export default async function ProtectedAccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuthenticatedCustomer();
    return children;
}
