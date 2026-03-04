

import Link from "next/link";
import { InviteEmployee } from "~/app/_components/admin/employee/invite";
import { Button } from "~/app/_components/ui/button";
import { api } from '~/trpc/server';
import { DataTable } from "./data-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmployeesPage({ params }: { params: { guildId: string } }) {
  const employees = await api.web.userOnGuild.getEmployees({ guildId: params.guildId })

  return (
    <div className="flex-1 rounded-xl px-20 flex-col">
      <div className="flex items-center justify-between space-y-2 pb-2">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Empleados</h2>
          <p className="text-muted-foreground">
            De toda tu organización
          </p>
        </div>
        <div className="flex gap-10">
          <Button type="button" variant={"outline"}>
            <Link href={`/v1/${params.guildId}/settings/invites`}>
              Ver invitaciones
            </Link>
          </Button>
          {/* <AuthorizedButton type="EMPLOYEE" href={`/v1/${params.guildId}/employees/create`} /> */}
          <InviteEmployee />
        </div>
      </div>
      <DataTable data={employees} />
    </div>
  )
}