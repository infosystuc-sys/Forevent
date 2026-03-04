import { auth } from '@forevent/auth';
import { api } from '~/trpc/server';
import AuthButton from "./authorized-button";

export default async function AuthorizedButton({ href, text, type }: {
    href: string,
    type: string,
    text?: string,
}) {
    const session = await auth()
    const guilds = await api.web.guild.getGuilds({ email: session?.user?.email! })

    return <AuthButton type={type} href={href} text={text} session={session} guilds={guilds} />;
}
