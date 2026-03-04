import { api } from '~/trpc/server';
import { DataTable } from "./data-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmployeesPage({ params }: { params: { eventId: string } }) {
  const users = await api.web.userOnEvent.all({ eventId: params.eventId })

  return (
    <div className="flex-1 rounded-xl px-20 flex-col">
      <div className="flex items-center justify-between space-y-2 pb-2">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Usuarios</h2>
          <p className="text-muted-foreground">
            En este evento
          </p>
        </div>
        {/* <div className="flex gap-10">
          <Button type="button" variant={"outline"}>
            <Link href={`/v1/${params.guildId}/settings/invites`}>
              Ver invitaciones
            </Link>
          </Button>
          <AuthorizedButton type="EMPLOYEE" href={`/v1/${params.guildId}/employees/create`} />
        </div> */}
      </div>
      <DataTable data={users} />
    </div>
  )
}