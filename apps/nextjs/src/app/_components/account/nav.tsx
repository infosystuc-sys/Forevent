
import { auth } from '@forevent/auth';
import { api } from '~/trpc/server';
import Navbar from "./navbar";

export default async function AccountNav() {
  const session = await auth()
  const invites = await api.web.userOnGuild.getInvites({ email: session?.user?.email! as string })
  return <Navbar session={session} invites={invites} />;
}
