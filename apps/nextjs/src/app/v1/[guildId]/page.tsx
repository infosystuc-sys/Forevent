import { auth } from "@forevent/auth"
import GuildSummary from "~/app/_components/admin/guild/summary"
import { Separator } from "~/app/_components/ui/separator"
import { api } from "~/trpc/server"

async function DashboardPage({ params }: { params: { guildId: string } }) {
    const data = await api.web.guild.getGuildSummary({ guildId: params?.guildId, period: "LASTWEEK" })
    const session = await auth()
    return (
        <div className="container">
            <GuildSummary session={session} summary={data} />
        </div>
    )
}

export default DashboardPage