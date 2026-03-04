import CreateDeal from '~/app/_components/admin/deals/create'
import { api } from '~/trpc/server'

async function CreateDealPage({ params }: { params: { eventId: string } }) {
    const products = await api.web.event.products({ eventId: params.eventId })
    return (
        <div className='flex flex-1 items-center justify-center'>
            
            <div className='max-w-7xl w-full'>
                <CreateDeal eventId={params.eventId} initialProducts={products} />
            </div>
        </div>
    )
}

export default CreateDealPage