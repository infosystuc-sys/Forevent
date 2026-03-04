import AuthorizedButton from "~/app/_components/admin/authorized"
import { api } from "~/trpc/server"
import { DataTable } from "./data-table"

type Search = 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'PENDING' | 'PAST' | undefined
const searchStrings = ['ACCEPTED' , 'REJECTED' , 'CANCELLED' , 'PENDING' , 'PAST']

export default async function LocationsPage({ params, searchParams }: { params: { guildId: string }, searchParams?: { [q: string]: Search }; }) {

  const data = await api.web.event.byGuildId({ guildId: params.guildId, q: searchParams?.q && searchStrings.includes(searchParams?.q) ? searchParams?.q : undefined  })

  return (
    <div className="flex-1 rounded-xl px-20 flex-col">
      <div className="flex items-center justify-between space-y-2 ">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Eventos</h2>
          <p className="text-muted-foreground">
            De toda tu organización
          </p>
        </div>
        <AuthorizedButton type="EVENT" href={`/v1/${params.guildId}/events/create`} />
      </div>
      <DataTable data={data} />
    </div>
  )
}