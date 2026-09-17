import { api } from '~/trpc/server'
import CreateGuildDialog from './create-guild-dialog'
import { DataTable } from './data-table'
import { requireStaff } from '~/lib/staff'

export default async function Page() {
  // Next renderiza layout y page en paralelo: el guard del layout no evita que el page
  // consulte datos antes del redirect, así que cada página vuelve a exigir Super Usuario.
  await requireStaff()
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
        <CreateGuildDialog />
      </div>
      <DataTable data={data} />
    </div>
  )
}
