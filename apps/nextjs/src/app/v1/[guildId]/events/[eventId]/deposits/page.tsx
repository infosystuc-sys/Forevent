import { Button } from '@forevent/ui/button'
import Link from 'next/link'
import { api } from '~/trpc/server'
import { DataTable } from './data-table'

async function DepositsPage({ params }: { params: { guildId: string, eventId: string } }) {
    const deposits = await api.web.event.deposits({ eventId: params.eventId })
    return (
        <div className="flex-1 rounded-xl px-20 flex-col">
            <div className="flex items-center justify-between space-y-2 pb-2">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Depositos</h2>
                    <p className="text-muted-foreground">
                        En este evento
                    </p>
                </div>
                <div className="flex gap-10">
                    <Button type="button" variant={"outline"}>
                        <Link href={`/v1/${params.guildId}/events/${params.eventId}/deals/create`}>
                            Crear
                        </Link>
                    </Button>
                </div>
            </div>
            <DataTable data={deposits} />
        </div>
    )
}

export default DepositsPage