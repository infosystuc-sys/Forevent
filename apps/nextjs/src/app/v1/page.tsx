import { auth } from '@forevent/auth';
import { redirect } from 'next/navigation';
import LoadAndUpdate from '~/app/_components/admin/v1';
import { api } from '~/trpc/server';

export default async function Page() {
    const session = await auth()
    const email = session?.user?.email
    if (!email) {
        redirect('/login')
    }

    const guilds = await api.web.guild.getGuilds({ email })
    const isVerified = await api.web.auth.getIsVerified({ email, type: "USER" })

    return (
        <div className='flex h-screen flex-1 items-center justify-center'>
            <LoadAndUpdate session={session} guilds={guilds} isVerified={isVerified} />
        </div>
    )
}

