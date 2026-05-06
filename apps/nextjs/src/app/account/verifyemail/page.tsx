import { auth } from '@forevent/auth';
import { redirect } from 'next/navigation';
import VerifyForm from '~/app/_components/auth/verify-form';
import { api } from '~/trpc/server';

export default async function Page() {
    const session = await auth()
    const email = session?.user?.email
    if (!email) {
        redirect('/login')
    }

    const isVerified = await api.web.auth.getIsVerified({ email, type: "USER" })

    if (isVerified.emailVerified) {
        redirect('/v1')
    }

    const challengeId = await api.web.auth.createValidation({ email, type: "USER" })

    return (
        <div className="flex-1">
            <div className="h-screen flex items-center justify-center">
                <div className="flex w-full flex-col items-center space-y-6 sm:w-[25rem]">
                    <VerifyForm session={session} challengeId={challengeId} />
                </div>
            </div>
        </div>
    )
}
