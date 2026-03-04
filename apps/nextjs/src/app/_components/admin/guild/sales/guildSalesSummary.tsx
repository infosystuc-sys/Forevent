"use client"
import { RouterOutputs } from "@forevent/api"
import { Separator } from "~/app/_components/ui/separator"
import { DataTable } from './data-table'

export default function GuildSalesSummary({ sales }: {
  sales: Awaited<RouterOutputs["web"]["guild"]["getGuildSales"]>
}) {

  return (
    <section className="my-8">
        <h4 className="text-2xl">Ganancias por evento</h4>
        <DataTable data={sales} />
    </section>
  )
}
