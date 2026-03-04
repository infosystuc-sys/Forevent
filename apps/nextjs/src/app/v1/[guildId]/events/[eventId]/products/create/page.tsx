import CreateProduct from '~/app/_components/admin/products/create'

async function CreateEmployeePage({ params }: { params: { eventId: string } }) {

    return (
        <div>
            <CreateProduct eventId={params.eventId} />
        </div>
    )
}

export default CreateEmployeePage