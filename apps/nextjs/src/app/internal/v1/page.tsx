import { Briefcase, CalendarCheck2, CalendarClock } from 'lucide-react'
import { api } from '~/trpc/server'
import SummaryCard from '~/app/_components/admin/summary-card'
import { requireStaff } from '~/lib/staff'

export default async function Home() {
  // Next renderiza layout y page en paralelo: el guard del layout no evita que el page
  // consulte datos antes del redirect, así que cada página vuelve a exigir Super Usuario.
  await requireStaff()
    // El layout de /internal/v1 ya exige Super Usuario; la API además usa internalProcedure.
    const stats = await api.web.internal.stats()

    return (
        <div>
            <div className="px-14">
                <div className="">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <SummaryCard item={{ value: stats.guilds.toString(), icon: <Briefcase />, title: 'Organizaciónes' }} />
                        <SummaryCard item={{ value: stats.events.toString(), icon: <CalendarCheck2 />, title: 'Eventos' }} />
                        <SummaryCard item={{ value: stats.pendingEvents.toString(), icon: <CalendarClock />, title: 'Solicitudes de eventos', href: "/internal/v1/events" }} />
                    </div>
                </div>
            </div>
        </div>
    )
}