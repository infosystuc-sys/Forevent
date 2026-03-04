import { auth } from "@forevent/auth";
import { api } from "~/trpc/server";
import { DataTable } from "./data-table";

export default async function Page({ params }: { params: { guildId: string } }) {
    const session = await auth()
    const data = await api.web.cashier.events({ guildId: params.guildId, email: session?.user.email! as string })
    console.log(session, "session!")
    return (
        <div className="flex-1 rounded-xl px-20 flex-col">
            <div className="flex items-center justify-between space-y-2 ">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Eventos</h2>
                    <p className="text-muted-foreground">
                        De toda tu organización
                    </p>
                </div>
                {/* <AuthorizedButton type="EVENT" href={`/v1/${params.guildId}/events/create`} /> */}
            </div>
            <DataTable data={data} session={session} />
        </div>
    )
}