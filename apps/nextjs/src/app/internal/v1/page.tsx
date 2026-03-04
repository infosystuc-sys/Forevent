import { auth } from '@forevent/auth'
import { Briefcase, CalendarCheck2, CalendarClock } from 'lucide-react'
import { redirect } from 'next/navigation'
import { api } from '~/trpc/server'
import SummaryCard from '~/app/_components/admin/summary-card'

export default async function Home() {
    const stats = await api.web.internal.stats()
    const session = await auth()
    console.log(session, "SESSION!")
    const checkAuth = await api.web.internal.internalUser({ email: session?.user?.email! })

    if (!checkAuth) {
        redirect("/v1")
    }

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