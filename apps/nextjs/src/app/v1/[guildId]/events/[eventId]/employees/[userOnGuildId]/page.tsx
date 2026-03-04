import { Button } from "@forevent/ui/button"
import Link from "next/link"
import Return from "~/app/_components/return"
import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/ui/avatar"
import { CardDescription, CardHeader, CardTitle } from "~/app/_components/ui/card"
import { api } from "~/trpc/server"
import { ProductsTable } from "./products-table"
import { TicketsTable } from "./tickets-table"

export default async function EmployeePage({ params }: { params: { userOnGuildId: string, eventId: string, guildId: string } }) {
    console.log(params, 'params')
    const employeeScans = await api.web.employeeOnEvent.scans({ userOnGuildId: params.userOnGuildId, eventId: params.eventId })

    if (!employeeScans || !employeeScans.userOnGuild?.user.discharged) {
        return (
            <div className="container h-screen">
                <h1>Error al mostrar historial de empleado</h1>
                <p>Este empleado no existe, o no está disponible</p>
            </div>
        )
    }

    return (
        <div className="flex-1 rounded-xl container flex-col">
            <Return />
            <div>
                <div className="flex space-y-2 w-full justify-between">
                    <CardHeader>
                        <CardTitle>
                            Detalle del empleado
                        </CardTitle>
                        <CardDescription>
                            Aquí puedes ver el detalle del empleado y sus escaneos
                        </CardDescription>
                    </CardHeader>
                    <div className=" pt-4">
                        <Button type="button" variant={"primary"}>
                            <Link href={`/v1/${params.guildId}/events/${params.eventId}/employees/${params.userOnGuildId}/modify`}>
                                Modificar designaciones
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-6 mt-4">
                    <div className="w-min">
                        <Avatar className="h-40 w-40">
                            <AvatarImage
                                src={employeeScans.userOnGuild.user.image ?? ""}
                                alt={"image"}
                            />
                            <AvatarFallback className="text-lg bg-neutral-900">{employeeScans.userOnGuild.user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h3 className="text-2xl font-light">{employeeScans.userOnGuild.user.name}</h3>
                        <p className="text-primary">{employeeScans.userOnGuild.user.about}</p>
                        <p>{employeeScans.userOnGuild.user.email}</p>
                    </div>
                </div>

            </div>
            <div className="pt-4">
                <h1 className="text-2xl font-bold tracking-tight">Escaneos</h1>
            </div>
            {
                employeeScans.products && (
                    <>
                        <h3 className="text-xl font-light">Productos escaneados</h3>
                        <ProductsTable data={employeeScans} />
                    </>
                )
            }
            {
                employeeScans.tickets && (
                    <>
                        <h3 className="text-xl font-light">Tickets escaneados</h3>
                        <TicketsTable data={employeeScans} />
                    </>
                )
            }

        </div>
    )
}