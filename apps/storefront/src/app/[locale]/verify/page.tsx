import type {Metadata} from 'next';
import {Suspense} from 'react';
import {connection} from 'next/server';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Link} from '@/i18n/navigation';
import {Loader2, XCircle} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {verifyCustomerAccount} from './verify-account.server';
import {VerifyResult} from './verify-result';

export const metadata: Metadata = {
    title: 'Verify Email',
    description: 'Verify your email address to complete registration.',
};

async function VerifyPageContent({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    await connection();
    const t = await getTranslations('Verify');
    const params = await searchParams;
    const token = params.token;

    if (!token) {
        return (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-center">
                        <XCircle className="h-16 w-16 text-destructive"/>
                    </div>
                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-bold">{t('invalidLink')}</h1>
                        <p className="text-muted-foreground">{t('invalidLinkMessage')}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Link href="/register" className="block">
                            <Button variant="outline" className="w-full">
                                {t('createNewAccount')}
                            </Button>
                        </Link>
                        <Link href="/sign-in" className="block">
                            <Button variant="ghost" className="w-full">
                                {t('backToSignIn')}
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const result = await verifyCustomerAccount(token);
    return <VerifyResult result={result}/>;
}

function VerifyLoading() {
    return (
        <Card>
            <CardContent className="pt-6 space-y-4">
                <div className="flex justify-center">
                    <Loader2 className="h-16 w-16 text-primary animate-spin"/>
                </div>
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold">Verifying Your Account</h1>
                    <p className="text-muted-foreground">
                        Please wait while we verify your email address...
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function VerifyPage({searchParams}: PageProps<'/[locale]/verify'>) {
    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6">
                <Suspense fallback={<VerifyLoading/>}>
                    <VerifyPageContent searchParams={searchParams}/>
                </Suspense>
            </div>
        </div>
    );
}
