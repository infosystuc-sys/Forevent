import { auth } from "@forevent/auth";
import { api } from "~/trpc/server";
import AdminSidebar from "./sidebar";

/** Carga los datos del sidebar en el servidor (misma estrategia que AdminNav). */
export default async function AdminSidebarNav() {
  const session = await auth();
  const [guilds, invites] = await Promise.all([
    api.web.guild.getGuilds({ email: session?.user?.email! }),
    api.web.userOnGuild.getInvites({ email: session?.user?.email! }),
  ]);
  return <AdminSidebar session={session} guilds={guilds} invites={invites} />;
}
