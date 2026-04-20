import { ArrowLeft, MapPin, Calendar, Ticket, Package, DoorOpen, Mic2, Container, Building2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/ui/avatar"
import { Badge } from "~/app/_components/ui/badge"
import { Button } from "~/app/_components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/app/_components/ui/card"
import { customdayjs } from "~/lib/constants"
import { api } from "~/trpc/server"

const statusLabel: Record<string, string> = {
    ACCEPTED: "Publicado",
    DRAFT: "Borrador",
    PENDING: "Pendiente",
    REJECTED: "Rechazado",
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    ACCEPTED: "default",
    DRAFT: "secondary",
    PENDING: "outline",
    REJECTED: "destructive",
}

export default async function AdminEventDetailPage({ params }: { params: { id: string } }) {
    const event = await api.web.event.adminDetail({ id: params.id }).catch(() => null)

    if (!event) {
        return <p className="p-8 text-muted-foreground">Evento no encontrado.</p>
    }

    const totalCapacity = event.tickets?.reduce((sum, t) => sum + t.quantity, 0) ?? 0

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold">{event.name}</h1>
                        <Badge variant={statusVariant[event.status] ?? "secondary"}>
                            {statusLabel[event.status] ?? event.status}
                        </Badge>
                    </div>
                    {event.about && (
                        <p className="mt-1 text-sm text-muted-foreground">{event.about}</p>
                    )}
                </div>
                <Button variant="outline" asChild>
                    <Link href={`/admin/events/${event.id}/edit`}>Editar evento</Link>
                </Button>
            </div>

            {/* Imagen + Fecha/Ubicación en dos mitades */}
            <div className="grid grid-cols-1 overflow-hidden rounded-xl border md:grid-cols-2">
                {/* Mitad izquierda — imagen */}
                <div className="relative flex h-64 items-center justify-center bg-black">
                    {event.image ? (
                        <Image src={event.image} alt={event.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" />
                    ) : (
                        <div className="flex h-64 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                            Sin imagen
                        </div>
                    )}
                </div>

                {/* Mitad derecha — fecha y ubicación */}
                <div className="flex flex-col justify-center gap-6 bg-card p-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Fecha y hora
                        </div>
                        <p className="text-sm">
                            <span className="font-medium">Inicio:</span>{" "}
                            {customdayjs(event.startsAt).format("DD/MM/YYYY HH:mm")}
                        </p>
                        {event.endsAt && (
                            <p className="text-sm">
                                <span className="font-medium">Fin:</span>{" "}
                                {customdayjs(event.endsAt).format("DD/MM/YYYY HH:mm")}
                            </p>
                        )}
                    </div>

                    <div className="h-px bg-border" />

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            Ubicación
                        </div>
                        {event.location ? (
                            <>
                                {event.location.name && (
                                    <p className="text-sm font-medium">{event.location.name}</p>
                                )}
                                <p className="text-sm text-muted-foreground">{event.location.address}</p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Sin ubicación asignada</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tickets */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        Tickets
                        <Badge variant="secondary" className="ml-auto">{event.tickets?.length ?? 0} tipos · {totalCapacity} total</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {event.tickets && event.tickets.length > 0 ? (
                        <div className="space-y-3">
                            {event.tickets.map((ticket) => (
                                <div key={ticket.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="font-medium">{ticket.name}</p>
                                        {ticket.about && <p className="text-sm text-muted-foreground">{ticket.about}</p>}
                                        {ticket.validUntil && (
                                            <p className="text-xs text-muted-foreground">Válido hasta: {customdayjs(ticket.validUntil).format("DD/MM/YYYY")}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">${ticket.price.toLocaleString()}</p>
                                        <p className="text-sm text-muted-foreground">{ticket.quantity} unidades</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Sin tickets configurados</p>
                    )}
                </CardContent>
            </Card>

            {/* Productos */}
            {event.products && event.products.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Productos
                            <Badge variant="secondary" className="ml-auto">{event.products.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {event.products.map((product) => (
                                <div key={product.id} className="flex items-center gap-3 rounded-lg border p-3">
                                    <Avatar className="h-10 w-10 rounded-md">
                                        <AvatarImage src={product.image ?? ""} />
                                        <AvatarFallback className="rounded-md">{product.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium">{product.name}</p>
                                        {product.about && <p className="text-sm text-muted-foreground">{product.about}</p>}
                                        <Badge variant="outline" className="mt-1 text-xs">{product.type}</Badge>
                                    </div>
                                    <p className="font-semibold">${product.price.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Puertas */}
            {event.gates && event.gates.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DoorOpen className="h-4 w-4" />
                            Puertas
                            <Badge variant="secondary" className="ml-auto">{event.gates.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {event.gates.map((gate) => (
                                <div key={gate.id} className="rounded-lg border p-3">
                                    <p className="font-medium">{gate.name}</p>
                                    {gate.about && <p className="text-sm text-muted-foreground">{gate.about}</p>}
                                    <p className="mt-1 text-xs text-muted-foreground">{gate._count.employeeOnEvent} empleados asignados</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Artistas */}
            {event.artists && event.artists.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mic2 className="h-4 w-4" />
                            Artistas
                            <Badge variant="secondary" className="ml-auto">{event.artists.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {event.artists.map((artist) => (
                                <div key={artist.id} className="flex items-center gap-2 rounded-lg border p-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={artist.image ?? ""} />
                                        <AvatarFallback>{artist.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-medium">{artist.name}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Depósitos */}
            {event.deposits && event.deposits.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Container className="h-4 w-4" />
                            Depósitos
                            <Badge variant="secondary" className="ml-auto">{event.deposits.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {event.deposits.map((deposit) => (
                            <div key={deposit.id} className="rounded-lg border p-4 space-y-3">
                                <div>
                                    <p className="font-medium">{deposit.name}</p>
                                    {deposit.about && <p className="text-sm text-muted-foreground">{deposit.about}</p>}
                                </div>

                                {deposit.productsOnDeposit && deposit.productsOnDeposit.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Productos</p>
                                        <div className="space-y-1">
                                            {deposit.productsOnDeposit.map((pod, j) => (
                                                <div key={j} className="flex justify-between text-sm px-2 py-1 rounded bg-muted/40">
                                                    <span>{pod.product?.name ?? "—"}</span>
                                                    <span className="font-medium">{pod.quantity} ud</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {deposit.counter && deposit.counter.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Mostradores</p>
                                        <div className="space-y-1">
                                            {deposit.counter.map((counter) => (
                                                <div key={counter.id} className="flex items-center gap-2 text-sm px-2 py-1 rounded bg-muted/40">
                                                    <Building2 className="h-3 w-3 text-muted-foreground" />
                                                    <span>{counter.name}</span>
                                                    {counter.about && <span className="text-muted-foreground">— {counter.about}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
