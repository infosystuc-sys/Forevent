import OrganizationForm from "../form"
import { createOrganizationAction } from "../actions"

export default function NewOrganizationPage() {
    return (
        <div className="mx-auto w-full max-w-4xl space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-muted-foreground">Panel de dueños</p>
                <h1 className="text-2xl font-semibold">Nueva organización</h1>
                <p className="text-sm text-muted-foreground">
                    Completa los datos para registrar una nueva organización en Forevent.
                </p>
            </div>
            <OrganizationForm action={createOrganizationAction} />
        </div>
    )
}
