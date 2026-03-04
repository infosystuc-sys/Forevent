import CashierForm from '~/app/_components/admin/event/cashiers/cashier-form'
import { api } from '~/trpc/server'

export default async function Page ({ params }: { params: { eventId: string, guildId: string, counterId: string } }) {
  const data = await api.web.cashier.all({ counterId: params.counterId })
  
  console.log(data?.products, 'elementosss')
  
  return (
    <div className='flex flex-1 flex-col'>
      <CashierForm counterId={params.counterId} data={data} eventId={params.eventId} guildId={params.guildId} />
    </div>
  )
}
