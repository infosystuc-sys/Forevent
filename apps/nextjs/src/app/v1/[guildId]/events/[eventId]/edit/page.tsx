"use client"

import { useParams } from "next/navigation"
import CreateEvent from "~/app/_components/admin/event/create"
import { Icons } from "~/app/_components/ui/icons"
import { api } from "~/trpc/react"

export default function EditEventPage() {
    const params = useParams()
    const eventId = params.eventId as string
    const guildId = params.guildId as string

    const event = api.web.event.byId.useQuery({ id: eventId })
    const employees = api.web.userOnGuild.getEmployees.useQuery({ guildId })

    if (event.isLoading || employees.isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!event.data) {
        return <p className="p-8 text-muted-foreground">Evento no encontrado.</p>
    }

    if (!employees.data) {
        return <p className="p-8 text-muted-foreground">No se pudieron cargar los empleados.</p>
    }

    return (
        <CreateEvent
            guildId={guildId}
            employees={employees.data}
            initialEvent={event.data}
            eventId={eventId}
        />
    )
}
