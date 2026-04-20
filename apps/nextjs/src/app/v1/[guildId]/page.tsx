import { auth } from "@forevent/auth"
import GuildSummary from "~/app/_components/admin/guild/summary"
import { api } from "~/trpc/server"

async function DashboardPage({ params }: { params: { guildId: string } }) {
    const [data, session] = await Promise.all([
        api.web.guild.getGuildSummary({ guildId: params.guildId, period: "LASTWEEK" }),
        auth(),
    ])
    return (
        <div className="container">
            <GuildSummary session={session} summary={data} />
        </div>
    )
}

export default DashboardPage
