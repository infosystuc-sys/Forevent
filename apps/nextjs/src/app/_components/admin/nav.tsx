
import { auth } from '@forevent/auth';
import { api } from '~/trpc/server';
import Navbar from "./navbar";

export default async function AdminNav({ options }: { options?: { logo: boolean, nav: boolean, menu: boolean, selector: boolean } }) {
  const session = await auth()
  const [guilds, invites] = await Promise.all([
    api.web.guild.getGuilds({ email: session?.user?.email! }),
    api.web.userOnGuild.getInvites({ email: session?.user?.email! }),
  ])
  return <Navbar options={options} session={session} guilds={guilds} invites={invites} />;
}
