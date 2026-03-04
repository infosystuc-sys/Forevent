import { BadgePercent, CircleDollarSign, Milk, TicketPercent } from "lucide-react"
import StoreTablesSummary from "~/app/_components/admin/event/counter/purchases-summary-table"
import SummaryCard from "~/app/_components/admin/summary-card"
import { Separator } from "~/app/_components/ui/separator"
import { api } from "~/trpc/server"

const StoreDashboard = async ({ params }: { params: { eventId: string, guildId: string } }) => {
    const sales = await api.web.purchase.total({ eventId: params.eventId })

    return (
        <div className="container">
            <h2 className="text-3xl font-semibold tracking-wide ">Resumen de ventas</h2>

            <Separator className="my-6" />

            <div className="gap-2 flex flex-col justify-center">

                <div className="grow">
                    <SummaryCard item={{
                        title: "Ingresos totales",
                        value: `$${sales.totalSales._sum.total ?? 0}`,
                        icon: <CircleDollarSign />,
                    }}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                    <div>
                        <SummaryCard item={{
                            title: "Ingresos por productos individuales",
                            value: `$${sales.totalProducts.reduce((acumulator, currentValue) => acumulator + currentValue.total, 0)}`,
                            icon: <Milk />,
                        }}
                        />
                    </div>
                    <div>
                        <SummaryCard item={{
                            title: "Ingresos por tickets",
                            value: `$${sales.totalTickets.reduce((acumulator, currentValue) => acumulator + currentValue.total, 0)}`,
                            icon: <TicketPercent />,
                        }}
                        />
                    </div>
                    <div>
                        <SummaryCard item={{
                            title: "Ingresos por promociones",
                            value: `$${sales.totalDeals.reduce((acumulator, currentValue) => acumulator + currentValue.total, 0)}`,
                            icon: <BadgePercent />,
                            href: ""
                        }}
                        />
                    </div>
                </div>

            </div>

            <Separator className="my-6" />

            <StoreTablesSummary sales={sales} eventId={params.eventId} guildId={params.guildId} />
        </div>
    )
}

export default StoreDashboard