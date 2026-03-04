import AssignProductOnDeposit from '~/app/_components/admin/deposit/assign'
import { api } from '~/trpc/server'

async function AssignProductOnDepositPage({ params }: { params: { eventId: string, depositId: string } }) {
  const products = await api.web.event.products({ eventId: params.eventId })
  return (
    <div className='flex-1 flex items-center justify-center'>
      <div className='max-w-7xl w-full'>
        <AssignProductOnDeposit eventId={params.eventId} inicialProducts={products} depositId={params.depositId} />
      </div>
    </div>
  )
}

export default AssignProductOnDepositPage