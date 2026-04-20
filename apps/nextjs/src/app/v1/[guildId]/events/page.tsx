import Link from "next/link"
import AuthorizedButton from "~/app/_components/admin/authorized"
import { Button } from "~/app/_components/ui/button"
import { api } from "~/trpc/server"
import { DataTable } from "./data-table"

type Search = 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'PENDING' | 'PAST'
const searchStrings: Search[] = ['ACCEPTED', 'REJECTED', 'CANCELLED', 'PENDING', 'PAST']

export default async function LocationsPage({
  params,
  searchParams,
}: {
  params: { guildId: string }
  searchParams?: { q?: Search; page?: string }
}) {
  const q = searchParams?.q && searchStrings.includes(searchParams.q) ? searchParams.q : undefined
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1)
  const pageSize = 20

  const { rows, total } = await api.web.event.byGuildId({
    guildId: params.guildId,
    q,
    page,
    pageSize,
  })

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const qs = (p: number) => {
    const sp = new URLSearchParams()
    if (q) sp.set("q", q)
    sp.set("page", String(p))
    return `?${sp.toString()}`
  }

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
      <DataTable data={rows} />
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages} · {total} eventos
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} asChild={page > 1}>
              {page > 1 ? <Link href={qs(page - 1)}>Anterior</Link> : <span>Anterior</span>}
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} asChild={page < totalPages}>
              {page < totalPages ? <Link href={qs(page + 1)}>Siguiente</Link> : <span>Siguiente</span>}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
