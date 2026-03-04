import { auth } from '@forevent/auth'
import CreateOrJoin from '~/app/_components/admin/createorjoin'

export default async function Page() {
    const session = await auth()
    return (
        <div className='flex-1'>
            <CreateOrJoin session={session}/>
        </div>
    )
}