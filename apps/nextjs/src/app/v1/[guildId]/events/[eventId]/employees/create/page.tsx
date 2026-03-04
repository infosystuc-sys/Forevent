import CreateEmployeeOnEvent from '~/app/_components/admin/employeeOnEvent/create'
import { api } from '~/trpc/server'

async function CreateEmployeePage({ params }: { params: { eventId: string } }) {
    const employeesNotOnEvent = await api.web.event.employeesNotOnEvent({ eventId: params.eventId })
    const counters = await api.web.event.counters({ eventId: params.eventId})
    const gates = await api.web.event.gates({ eventId: params.eventId})

    return (
        <div>
            <CreateEmployeeOnEvent initialEmployeesNotOnEvent={employeesNotOnEvent} initialCounter={counters} initialGates={gates} eventId={params.eventId} />
        </div>
    )
}

export default CreateEmployeePage