"use client"

import type { RouterOutputs } from "@forevent/api"
import type { Session } from '@forevent/auth'
import { redirect, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { api } from "~/trpc/react"
import { Icons } from '../ui/icons'

export default function LoadAndUpdate({ guilds, isVerified, session }: {
    guilds: Awaited<RouterOutputs["web"]["guild"]["getGuilds"]>,
    isVerified: Awaited<RouterOutputs["web"]["auth"]["getIsVerified"]>,
    session: Session | null
}) {
    const router = useRouter()

    const getIsVerified = api.web.auth.getIsVerified.useQuery({
        email: session?.user?.email!,
        type: "USER"
    }, { initialData: isVerified })

    const getGuilds = api.web.guild.getGuilds.useQuery({ email: session?.user?.email! }, { initialData: guilds })

    useEffect(() => {
        console.log(getIsVerified.data, "GET IS VERIFIED")
        if (getIsVerified.data?.emailVerified === false || !getIsVerified.data?.emailVerified) {
            redirect("/account/verifyemail")
        } else if (getIsVerified.data?.passwordVerified === false) {
            redirect("/account/restorepassword")
        } else if (getGuilds.data?.length === 0) {
            redirect("/v1/welcome")
        } else {
            // session.update({
            //     user: {
            //         ...session?.data?.user,
            //         guild: getGuilds.data[0]
            //     }
            // })
            let role = getGuilds.data[0]?.role
            if (role === "OWNER" || role === "MANAGER") {
                redirect(`/v1/${getGuilds.data[0]?.id}`)
            } else {
                redirect("/unauthorized")
            }
        }
    }, [getGuilds.data, getIsVerified.data])


    // console.log(session?.data?.user, "SESSION LOAD AND UPDATE")

    return (
        <div className="flex items-center justify-center  h-screen">
            <Icons.spinner className="mr-2 h-10 w-10 animate-spin" />
        </div>
    )
}