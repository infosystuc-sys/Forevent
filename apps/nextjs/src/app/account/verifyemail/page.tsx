import { auth } from '@forevent/auth';
import VerifyForm from '~/app/_components/auth/verify-form';
import { api } from '~/trpc/server';

export default async function Page({
    params,
    searchParams,
}: {
    params: { slug: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const session = await auth()

    const isVerified = await api.web.auth.getIsVerified({ email: session?.user?.email!, type: "USER" })

    // const validation = await api.web.createValidation.mutate({ email: session?.user?.email!, type: "USER" })

    return (
        <div className="flex-1">
            <div className="h-screen flex items-center justify-center">
                <div className="flex w-full flex-col items-center space-y-6 sm:w-[25rem]">
                    <VerifyForm session={session} isVerified={isVerified} />
                </div>
            </div>
        </div>
    )
}
