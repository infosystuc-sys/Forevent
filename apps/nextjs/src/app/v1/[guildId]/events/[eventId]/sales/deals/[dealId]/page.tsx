import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/ui/avatar"
import { api } from "~/trpc/server"
import { DataTable } from "./data-table"
import { BadgePercent } from "lucide-react"

export default async function DealsSalesPage({ params }: { params: { dealId: string, eventId: string } }) {
    const exchanges = await api.web.deal.exchanges({ dealId: params.dealId, eventId: params.eventId })
    // console.log(userPurchases, 'USER PURCHASE')
    const deal = await api.web.deal.byId({ dealId: params.dealId })
    console.log("exx", exchanges, 'exchangesddd')

    if (!deal || !deal.discharged) {
        return (
            <div className="container h-screen">
                <h1>dealo no encontrado</h1>
                <p>Este dealo no existe o no está disponible</p>
            </div>
        )
    }

    return (
        <div className="flex-1 rounded-xl container flex-col">
            <div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Canjes de la promocion</h1>
                </div>
                <div className="flex items-center gap-6 mt-10">
                    <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center">
                        <BadgePercent />
                    </div>

                    <div className="flex items-center gap-6 mt-10">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-2xl font-light">{deal.name}</h3>
                            <p className="text-primary">{deal.about}</p>
                            <p>Precio: ${deal.price}</p>
                        </div>
                    </div>
                </div>
            </div>
            <DataTable data={exchanges} />
        </div>
    )
}