import { auth } from '@forevent/auth';
import LoadAndUpdate from '~/app/_components/admin/v1';
import { api } from '~/trpc/server';

export default async function Page() {
    const session = await auth()
    const guilds = await api.web.guild.getGuilds({ email: session?.user?.email! })
    const isVerified = await api.web.auth.getIsVerified({ email: session?.user?.email!, type: "USER" })

    return (
        <div className='flex h-screen flex-1 items-center justify-center'>
            <LoadAndUpdate session={session} guilds={guilds} isVerified={isVerified} />
        </div>
    )
}

