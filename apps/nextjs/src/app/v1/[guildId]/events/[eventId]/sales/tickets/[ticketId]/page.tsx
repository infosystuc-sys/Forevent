import { Ticket } from "lucide-react"
import { api } from "~/trpc/server"
import { DataTable } from "./data-table"

export default async function TicketSalesPage ({ params }: { params: { ticketId: string, eventId: string } }) {
    const exchanges = await api.web.userTicket.exchanges({ ticketId: params.ticketId, eventId: params.eventId })
    const ticket = await api.web.eventTicket.byId({ ticketId: params.ticketId })
    console.log('exchangess', exchanges)

    if (!ticket || !ticket.discharged) {
        return (
            <div className="container h-screen">
                <h1>Ticket no encontrado</h1>
                <p>Este ticket no existe o no está disponible</p>
            </div>
        )
    }
    return (
        <div className="flex-1 rounded-xl container flex-col">
            <div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Canjes de tickets</h1>
                </div>
                <div className="flex items-center gap-6 mt-10">
                    <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center">
                        <Ticket/>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h3 className="text-2xl font-light">{ticket.name}</h3>
                        <p className="text-primary">{ticket.about}</p>
                        <p>Precio: ${ticket.price}</p>
                    </div>
                </div>
            </div>
            <DataTable data={exchanges} />
        </div>
    )
}