"use client"

import type { ArrayElement, RouterOutputs } from '@forevent/api'
import type { Session } from '@forevent/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from "~/trpc/react"
import { Button } from '../ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Icons } from '../ui/icons'

function InviteCard({ invite, action, loading }
    :
    {
        invite: ArrayElement<Awaited<RouterOutputs["web"]["userOnGuild"]["getInvites"]>>,
        action: ({ action, id }: { action: string, id: string }) => void,
        loading: boolean
    }) {

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {invite.guild.name}
                </CardTitle>
                <CardDescription>
                    Has sido invitado a unirte a esta organización
                </CardDescription>
            </CardHeader>
            {/* <CardContent>
                Tu rol es de
            </CardContent> */}
            <CardFooter className='flex items-center justify-between'>
                <Button disabled={loading} onClick={() => { action({ id: invite.id, action: "REJECT" }) }} variant={"destructive"}>
                    {loading ?
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        :
                        "Rechazar"
                    }
                </Button>
                <Button disabled={loading} onClick={() => { action({ id: invite.id, action: "ACCEPT" }) }} variant={"default"}>
                    {loading ?
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        :
                        "Aceptar"
                    }
                </Button>
            </CardFooter>
        </Card>
    )
}

function Invites({ invites, session }: {
    invites: Awaited<RouterOutputs["web"]["userOnGuild"]["getInvites"]>,
    session: Session | null
}) {
    const router = useRouter()
    const utils = api.useUtils()

    const modifyInvite = api.web.userOnGuild.modifyInvite.useMutation({
        onSuccess: async (res) => {
            console.log(res, "success");

            await utils.web.userOnGuild.getInvites.invalidate()
            await utils.web.guild.getGuilds.invalidate()

            if (res?.status === "ACCEPTED") {
                router.push(`/v1`)
            } else {
                router.back()
            }
            toast("Exito", {
                description: `${res?.status === "CANCELLED" ? "Rechazaste la invitacion a" : "Te uniste a"} ${res?.guild.name}`,
                action: {
                    label: "Cerrar", onClick: () => {
                        console.log('close')
                    }
                }
            })
        },
        onError: async (error) => {
            console.log(error.data, error.message, error.shape, "error")
            await utils.web.userOnGuild.getInvites.invalidate()
            router.refresh()
            toast("Ocurrio un error", {
                description: "Invitacion no encontrada o ya fue utilizada",
                action: {
                    label: "Cerrar", onClick: () => {
                        console.log("close!")
                    }
                }
            })
        }
    })

    const getInvites = api.web.userOnGuild.getInvites.useQuery({ email: session?.user.email! as string }, { initialData: invites })

    function onConfirm({ action, id }: { action: string, id: string }) {
        if (action === "ACCEPT") {
            modifyInvite.mutate({ inviteId: id, action: "ACCEPT" })
        } else {
            modifyInvite.mutate({ inviteId: id, action: "REJECT" })
        }
    }

    return (
        <div className='flex items-center gap-5 py-5'>
            {getInvites.data.length === 0 ?
                <div className="flex px-20 items-center justify-center  h-full py-20">
                    <p className="text-2xl font-bold tracking-tight">No tienes invitaciones</p>
                </div>
                :
                getInvites.data?.map((invite, index) => {
                    return <InviteCard invite={invite} key={index.toString()} loading={modifyInvite.isPending} action={onConfirm} />
                })
            }
        </div>
    )
}

export default Invites