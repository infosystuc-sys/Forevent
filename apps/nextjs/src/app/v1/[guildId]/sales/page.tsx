import { CircleDollarSign, Milk, TicketPercent } from "lucide-react"
import GuildSalesSummary from "~/app/_components/admin/guild/sales/guildSalesSummary"
import SummaryCard from "~/app/_components/admin/summary-card"
import { Separator } from "~/app/_components/ui/separator"
import { api } from "~/trpc/server"

export default async function GuildSalesDasboard({ params }: { params: { guildId: string } }) {
    const guildSales = await api.web.guild.getGuildSales({ guildId: params.guildId })

    if (!guildSales) {
        return (
            <section className="my-8 flex justify-center items-center flex-col">
                <h1 className="text-2xl font-medium text-neutral-500">Esta organización no ha registrado ningun tipo de venta</h1>
            </section>
        )
    }

    return (
        <div className="container">
            <h2 className="text-3xl font-semibold tracking-wide ">Ventas de la organización</h2>

            <Separator className="my-6" />

            <div className="flex justify-center items-center gap-2">
                <div className="grow">
                    <SummaryCard item={{
                        title: "Ingresos totales de toda la organización",
                        value: `$${guildSales.totalGuildSales ?? 0}`,
                        icon: <CircleDollarSign />,
                    }}
                    />
                </div>
                <div className="grow">
                    <SummaryCard item={{
                        title: "Ingresos totales por productos",
                        value: `$${guildSales.productsSales ?? 0}`,
                        icon: <Milk />,
                    }}
                    />
                </div>
                <div className="grow">
                    <SummaryCard item={{
                        title: "Ingresos totales por tickets",
                        value: `$${guildSales.ticketsSales ?? 0}`,
                        icon: <TicketPercent />,
                    }}
                    />
                </div>
            </div>

            <Separator className="my-6" />

            <GuildSalesSummary sales={guildSales} />
        </div>
    )
}
