import db from "@forevent/db"
import { notFound } from "next/navigation"
import OrganizationForm from "../../form"
import { updateOrganizationAction } from "../../actions"
import { requireStaff } from "~/lib/staff"

export default async function EditOrganizationPage({ params }: { params: { id: string } }) {
  // Next renderiza layout y page en paralelo: el guard del layout no evita que el page
  // consulte datos antes del redirect, así que cada página vuelve a exigir Super Usuario.
  await requireStaff()
    const org = await db.guild.findUnique({
        where: { id: params.id },
        select: {
            id: true,
            name: true,
            email: true,
            phone_number: true,
            address: true,
            city: true,
            state: true,
            country: true,
            identifierType: true,
            identifier: true,
            taxType: true,
            userLimit: true,
            commissionRate: true,
            expiresAt: true,
            status: true,
            discharged: true,
            image: true,
        },
    })

    if (!org) notFound()

    const boundAction = updateOrganizationAction.bind(null, org.id)

    return (
        <div className="mx-auto w-full max-w-4xl space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-muted-foreground">Panel de dueños</p>
                <h1 className="text-2xl font-semibold">Editar organización</h1>
                <p className="text-sm text-muted-foreground">
                    Modifica los datos de <span className="font-medium">{org.name}</span>.
                </p>
            </div>
            <OrganizationForm initialData={org} action={boundAction} />
        </div>
    )
}
