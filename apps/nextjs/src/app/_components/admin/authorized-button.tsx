"use client"

import type { RouterOutputs } from "@forevent/api"
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '../ui/button'

export default function AuthButton({ href, text, guilds }: {
    href: string,
    text?: string,
    guilds: Awaited<RouterOutputs["web"]["guild"]["getGuilds"]>
}) {
    const params = useParams()
    return (
        <>
            {guilds.some((guild) => {
                if (guild.id === params.guildId!) {
                    switch (guild.role) {
                        case "OWNER":
                            return true
                        case "MANAGER":
                            return true
                        default:
                            return false
                    }
                }
            }) ?
                <Link href={href}>
                    <Button>{text ?? "Crear"}</Button>
                </Link>
                :
                <></>
            }
        </>
    )
}
