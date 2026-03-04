import CreateEmployee from '~/app/_components/admin/employee/create'

function CreateEmployeePage({ params }: { params: { guildId: string } }) {
    return (
        <div className="container">
            <CreateEmployee guildId={params.guildId} />
        </div>
    )
}

export default CreateEmployeePage