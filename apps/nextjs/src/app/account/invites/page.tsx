import { auth } from '@forevent/auth';
import Invites from "~/app/_components/account/invites";
import Return from "~/app/_components/return";
import { api } from '~/trpc/server';

export default async function InvitePage({
    params,
    searchParams,
}: {
    params: { slug: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const session = await auth()
    const data = await api.web.userOnGuild.getInvites({ email: session?.user?.email! })
    // ura
    return (
        <div className="flex-1 rounded-xl px-20 flex-col">
            <Return />
            <div className="flex items-center px-5 justify-between space-y-2 pb-2">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Invitaciones</h2>
                    <p className="text-muted-foreground">
                        Para unirte a organizaciones
                    </p>
                </div>
            </div>
            <Invites session={session} invites={data} />
        </div>
    )
}