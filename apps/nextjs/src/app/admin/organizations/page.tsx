import db, { Status } from "@forevent/db"
import { Button } from "@forevent/ui/button"
import { ChevronLeft, ChevronRight, PauseCircle, PlayCircle, PencilLine, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import AdminToastListener from "../toast-listener"
import { deleteOrganizationAction, permanentDeleteOrganizationAction, toggleOrganizationStatus } from "./actions"
import DeleteOrganizationButton from "./delete-organization-button"

const PAGE_SIZE = 20

const statusClasses: Record<Status, string> = {
    [Status.ACCEPTED]: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    [Status.DRAFT]: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
    [Status.PENDING]: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
    [Status.CANCELLED]: "bg-rose-500/10 text-rose-600 border border-rose-500/20",
    [Status.REJECTED]: "bg-slate-500/10 text-slate-600 border border-slate-500/20",
}

const statusLabels: Record<Status, string> = {
    [Status.ACCEPTED]: "Activa",
    [Status.DRAFT]: "Borrador",
    [Status.PENDING]: "Pendiente",
    [Status.CANCELLED]: "Cancelada",
    [Status.REJECTED]: "Rechazada",
}

export default async function OrganizationsPage({
    searchParams,
}: {
    searchParams?: { page?: string }
}) {
    const page = Math.max(1, Number(searchParams?.page ?? "1") || 1)
    const skip = (page - 1) * PAGE_SIZE
    const [organizations, totalCount] = await Promise.all([
        db.guild.findMany({
            orderBy: { name: "asc" },
            take: PAGE_SIZE,
            skip,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                status: true,
                discharged: true,
                city: true,
                state: true,
                country: true,
                commissionRate: true,
                expiresAt: true,
                userLimit: true,
                _count: {
                    select: {
                        events: true,
                        usersOnGuild: true,
                    },
                },
            },
        }),
        db.guild.count(),
    ])
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

    return (
        <div className="flex flex-col gap-8">
            <AdminToastListener />

            <section className="flex flex-col gap-4 rounded-2xl border bg-card/60 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Panel de dueños</p>
                        <h1 className="text-3xl font-semibold tracking-tight">Organizaciones</h1>
                        <p className="text-muted-foreground">
                            Administra todas las organizaciones registradas en Forevent.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/organizations/new">+ Nueva organización</Link>
                    </Button>
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        Organizaciones{" "}
                        <span className="text-sm font-normal text-muted-foreground">({totalCount})</span>
                    </h2>
                </div>

                <div className="space-y-4">
                    {organizations.length === 0 && (
                        <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                            No hay organizaciones registradas. Crea la primera.
                        </div>
                    )}

                    {organizations.map((org) => {
                        const isActive = org.status === Status.ACCEPTED
                        const isAlive = org.discharged
                        const expires = new Intl.DateTimeFormat("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                        }).format(org.expiresAt)

                        return (
                            <div
                                key={org.id}
                                className={`flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between ${!isAlive ? "opacity-60" : ""}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                                        {org.image ? (
                                            <Image src={org.image} alt={org.name} fill sizes="48px" className="object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
                                                {org.name.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold">{org.name}</h3>
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[org.status]}`}>
                                                {statusLabels[org.status]}
                                            </span>
                                            {!isAlive && (
                                                <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600 border border-red-500/20">
                                                    Dada de baja
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{org.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {org.city}, {org.state}, {org.country}
                                        </p>
                                        <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground">
                                            <span>{org._count.events} eventos</span>
                                            <span>{org._count.usersOnGuild} miembros</span>
                                            <span>Comisión: {org.commissionRate}%</span>
                                            <span>Límite: {org.userLimit} usuarios</span>
                                            <span>Vence: {expires}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/admin/organizations/${org.id}/edit`}>
                                            <PencilLine className="mr-1 h-3.5 w-3.5" />
                                            Editar
                                        </Link>
                                    </Button>
                                    <form action={toggleOrganizationStatus.bind(null, org.id, org.status as Status)}>
                                        <Button size="sm" variant={isActive ? "secondary" : "default"} type="submit" className="gap-1.5">
                                            {isActive ? <PauseCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                                            {isActive ? "Desactivar" : "Activar"}
                                        </Button>
                                    </form>
                                    {isAlive && (
                                        <form action={deleteOrganizationAction.bind(null, org.id)}>
                                            <Button size="sm" variant="outline" type="submit" className="gap-1.5 border-orange-500/40 text-orange-600 hover:bg-orange-500/10">
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Dar de baja
                                            </Button>
                                        </form>
                                    )}
                                    {org._count.events === 0 && (
                                        <DeleteOrganizationButton
                                            orgName={org.name}
                                            action={permanentDeleteOrganizationAction.bind(null, org.id)}
                                        />
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">Página {page} de {totalPages}</p>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" disabled={page <= 1} asChild={page > 1}>
                                {page > 1 ? (
                                    <Link href={`/admin/organizations?page=${page - 1}`}>
                                        <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                                    </Link>
                                ) : (
                                    <span><ChevronLeft className="mr-1 h-4 w-4" /> Anterior</span>
                                )}
                            </Button>
                            <Button size="sm" variant="outline" disabled={page >= totalPages} asChild={page < totalPages}>
                                {page < totalPages ? (
                                    <Link href={`/admin/organizations?page=${page + 1}`}>
                                        Siguiente <ChevronRight className="ml-1 h-4 w-4" />
                                    </Link>
                                ) : (
                                    <span>Siguiente <ChevronRight className="ml-1 h-4 w-4" /></span>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}
