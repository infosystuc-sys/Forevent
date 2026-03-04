import { auth } from '@forevent/auth'
import { ChangePasswordForm } from '~/app/_components/account/changepassword-form'

export default async function Page() {
    const session = await auth()
    return (
        <div className="flex-1">
            <div className="h-screen flex items-center justify-center">
                <div className="flex w-full flex-col items-center space-y-6 sm:w-[25rem]">
                    <ChangePasswordForm session={session}/>
                </div>
            </div>
        </div>
    )
}
