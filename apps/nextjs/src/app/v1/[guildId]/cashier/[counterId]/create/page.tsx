import CreateDeal from '~/app/_components/admin/deals/create'
import { api } from '~/trpc/server'

async function CreateDealPage({ params }: { params: { eventId: string } }) {
    const products = await api.web.event.products({ eventId: params.eventId })
    return (
        <div>
            <CreateDeal eventId={params.eventId} initialProducts={products} />
        </div>
    )
}

export default CreateDealPage