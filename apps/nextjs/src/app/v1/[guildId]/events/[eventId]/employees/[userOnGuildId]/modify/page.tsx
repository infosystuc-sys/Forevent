import ModifyEmployeeOnEvent from '~/app/_components/admin/employeeOnEvent/modify'
import { api } from '~/trpc/server'

async function ModifyEmployeePage({ params }: { params: { userOnGuildId: string, eventId: string } }) {
    const employeeOnEvent = await api.web.employeeOnEvent.byId({ id: params.userOnGuildId })
    const counters = await api.web.event.counters({ eventId: params.eventId })
    const gates = await api.web.event.gates({ eventId: params.eventId })

    return (
        <div className='flex flex-1'>
            <ModifyEmployeeOnEvent employeeOnEvent={employeeOnEvent} userOnGuildId={params.userOnGuildId} initialCounter={counters} initialGates={gates} eventId={params.eventId} />
        </div>
    )
}

export default ModifyEmployeePage