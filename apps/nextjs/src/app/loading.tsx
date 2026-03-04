import { Icons } from '~/app/_components/ui/icons'

export default function LoadingPage() {
    return (
        <div className="flex items-center justify-center  h-screen">
            <Icons.spinner className="mr-2 h-10 w-10 animate-spin" />
        </div>
    )
}
