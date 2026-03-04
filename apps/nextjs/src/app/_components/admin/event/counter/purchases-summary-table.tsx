'use client'
import type { RouterOutputs } from "@forevent/api"
import { ProductsColumns, TicketsColumns, DealsColumns } from "./datatables/columns"
import { DataTable } from "./datatables/data-table"
import { useEffect } from "react"

const StoreTablesSummary = ({ sales, eventId, guildId }: { sales: Awaited<RouterOutputs["web"]["purchase"]["total"]>, eventId: string, guildId: string }) => {
  useEffect(() => {
    console.log(sales)
  }, [])
  
  return (
    <section className='my-8'>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <h3 className="text-2xl my-3">Productos</h3>
          <DataTable columns={ProductsColumns} data={sales.totalProducts} />
        </div>
        <div>
          <h3 className="text-2xl my-3">Tickets</h3>
          <DataTable columns={TicketsColumns} data={sales.totalTickets} />
        </div>
        <div>
          <h3 className="text-2xl my-3">Promociones</h3>
          <DataTable columns={DealsColumns} data={sales.totalDeals} />
        </div>
      </div>
    </section>
  )
}

export default StoreTablesSummary