"use client"

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { buttonVariants } from '~/app/_components/ui/button'
import { cn } from '~/lib/utils'

export default function SettingsNav() {
    const router = useRouter()
    const params = useParams()
    const path = usePathname()
    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1"
            )}
        >
            <Link
                href={`/v1/${params?.guildId}/settings`}
                className={cn(buttonVariants({ variant: "ghost" }), "hover:bg-transparent hover:underline", "justify-start")}>
                Perfil
            </Link>
            <Link
                href={`/v1/${params?.guildId}/settings/invites`}
                className={cn(buttonVariants({ variant: "ghost" }), "hover:bg-transparent hover:underline", "justify-start")}>
                Invitaciones
            </Link>
        </nav>
    )
}
