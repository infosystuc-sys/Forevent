import { auth } from "@forevent/auth"
import { CreateGuildForm } from "~/app/_components/admin/guild/create"

export default async function CreateGuild() {
    const session = await auth()
    return (
        <div className="flex-1">
            <CreateGuildForm session={session}/>
        </div>
    )
}