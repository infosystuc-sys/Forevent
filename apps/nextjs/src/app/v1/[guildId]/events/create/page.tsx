import CreateEvent from "~/app/_components/admin/event/create"
import { api } from "~/trpc/server"

export default async function Page({ params }: { params: { guildId: string } }) {
    // console.log(params.guildId, "PARAMS")
    const employees = await api.web.userOnGuild.getEmployees({ guildId: params.guildId })
    return (
        <div className="flex-1">
            <CreateEvent guildId={params.guildId} employees={employees} />
        </div>
    )
}
