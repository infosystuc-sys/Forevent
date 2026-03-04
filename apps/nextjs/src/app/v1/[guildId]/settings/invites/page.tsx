import { api } from "~/trpc/server"
import { DataTable } from "./data-table"

export default async function GuildEnumPage({ params }: { params: { guildId: string } }) {
  const invites = await api.web.userOnGuild.getGuildInvites({ guildId: params.guildId })
  return (
    <div className="space-y-6">
      <div>
        <div>
          <h3 className="text-lg font-medium">Invitaciones de la organización</h3>
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              Las invitaciones enviadas por tu organización
            </p>
          </div>
        </div>
        <DataTable data={invites} />
      </div>
    </div>
  )
}