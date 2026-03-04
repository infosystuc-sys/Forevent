import { api } from '~/trpc/server'
import { DataTable } from './data-table'

export default async function Page() {
  const data = await api.web.internal.allGuilds()
  return (
    <div className="grow  rounded-xl px-20 bg-neutral-950 flex-col">
      <div className="flex items-center justify-between space-y-2 pb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organizaciones</h2>
          <p className="text-muted-foreground">
            Organizaciones que utilizan la plataforma
          </p>
        </div>
      </div>
      <DataTable data={data} />
    </div>
  )
}
