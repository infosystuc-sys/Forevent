import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Search, UserCheck, UserX, X } from "lucide-react"

import db, { Role, type Prisma } from "@forevent/db"
import { Button } from "@forevent/ui/button"
import { Input } from "@forevent/ui/input"

import { requireStaff } from "~/lib/staff"
import AdminToastListener from "../toast-listener"
import { changeMembershipRole, removeMembership, toggleUserActive } from "./actions"
import ConfirmActionButton from "./confirm-action-button"

const PAGE_SIZE = 20

const FILTERS = {
    todos: "Todos",
    duenos: "Dueños / gerentes",
    empleados: "Empleados",
    desactivados: "Desactivados",
} as const
type Filter = keyof typeof FILTERS

const roleLabels: Record<Role, string> = {
    [Role.OWNER]: "Dueño",
    [Role.MANAGER]: "Gerente",
    [Role.EMPLOYEE]: "Empleado",
}

const roleClasses: Record<Role, string> = {
    [Role.OWNER]: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    [Role.MANAGER]: "bg-sky-500/10 text-sky-600 border-sky-500/20",
    [Role.EMPLOYEE]: "bg-amber-500/10 text-amber-600 border-amber-500/20",
}

function buildWhere(q: string, filter: Filter): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {}
    if (q) {
        where.OR = [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
        ]
    }
    const membership = (roles: Role[]): Prisma.UserOnGuildListRelationFilter => ({
        some: { discharged: true, status: "ACCEPTED", role: { in: roles } },
    })
    switch (filter) {
        case "duenos":
            where.userOnGuilds = membership([Role.OWNER, Role.MANAGER])
            break
        case "empleados":
            where.userOnGuilds = membership([Role.EMPLOYEE])
            break
        case "desactivados":
            where.discharged = false
            break
    }
    return where
}

export default async function UsersPage({
    searchParams,
}: {
    searchParams?: { page?: string; q?: string; f?: string }
}) {
    // Next renderiza layout y page en paralelo: el guard del layout no evita que el page
    // consulte datos antes del redirect, así que cada página vuelve a exigir Super Usuario.
    await requireStaff()

    const page = Math.max(1, Number(searchParams?.page ?? "1") || 1)
    const q = (searchParams?.q ?? "").trim()
    const filter: Filter = searchParams?.f && searchParams.f in FILTERS ? (searchParams.f as Filter) : "todos"
    const skip = (page - 1) * PAGE_SIZE
    const where = buildWhere(q, filter)

    const [users, totalCount, stats] = await Promise.all([
        db.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: PAGE_SIZE,
            skip,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
                emailVerified: true,
                discharged: true,
                userOnGuilds: {
                    where: { discharged: true },
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        role: true,
                        status: true,
                        guild: { select: { id: true, name: true } },
                        _count: { select: { employeeOnEvent: { where: { discharged: true } } } },
                    },
                },
                _count: { select: { ticketsOwner: true } },
            },
        }),
        db.user.count({ where }),
        Promise.all([
            db.user.count(),
            db.user.count({ where: { discharged: false } }),
            db.userOnGuild.count({ where: { discharged: true, status: "ACCEPTED", role: { in: [Role.OWNER, Role.MANAGER] } } }),
            db.userOnGuild.count({ where: { discharged: true, status: "ACCEPTED", role: Role.EMPLOYEE } }),
        ]),
    ])
    const [totalUsers, deactivated, adminMemberships, employeeMemberships] = stats
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

    const qs = (overrides: { page?: number; f?: Filter; q?: string }) => {
        const sp = new URLSearchParams()
        const nq = overrides.q ?? q
        const nf = overrides.f ?? filter
        if (nq) sp.set("q", nq)
        if (nf !== "todos") sp.set("f", nf)
        if ((overrides.page ?? page) > 1) sp.set("page", String(overrides.page ?? page))
        const s = sp.toString()
        return s ? `/admin/users?${s}` : "/admin/users"
    }
    const returnTo = qs({})

    const fmtDate = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })

    return (
        <div className="flex flex-col gap-8">
            <AdminToastListener />

            <section className="flex flex-col gap-4 rounded-2xl border bg-card/60 p-6 shadow-sm">
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Panel de administración</p>
                    <h1 className="text-3xl font-semibold tracking-tight">Usuarios</h1>
                    <p className="text-muted-foreground">
                        Todas las cuentas de Forevent, con sus roles en cada organización.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                    {[
                        ["Cuentas", totalUsers],
                        ["Dueños / gerentes", adminMemberships],
                        ["Empleados", employeeMemberships],
                        ["Desactivadas", deactivated],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border bg-card p-4">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="mt-1 text-2xl font-semibold">{value}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <form action="/admin/users" className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input name="q" defaultValue={q} placeholder="Buscar por nombre o email" className="pl-9" />
                    </div>
                    {filter !== "todos" && <input type="hidden" name="f" value={filter} />}
                    <Button type="submit" variant="secondary">Buscar</Button>
                    {q && (
                        <Button variant="ghost" asChild>
                            <Link href={qs({ q: "", page: 1 })}><X className="mr-1 h-4 w-4" /> Limpiar</Link>
                        </Button>
                    )}
                </form>

                <div className="flex flex-wrap gap-2">
                    {(Object.keys(FILTERS) as Filter[]).map((f) => (
                        <Button key={f} size="sm" variant={f === filter ? "secondary" : "outline"} asChild>
                            <Link href={qs({ f, page: 1 })}>{FILTERS[f]}</Link>
                        </Button>
                    ))}
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        {FILTERS[filter]}{" "}
                        <span className="text-sm font-normal text-muted-foreground">({totalCount})</span>
                    </h2>
                </div>

                <div className="space-y-4">
                    {users.length === 0 && (
                        <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                            No se encontraron usuarios con ese criterio.
                        </div>
                    )}

                    {users.map((user) => (
                        <div
                            key={user.id}
                            className={`flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between ${!user.discharged ? "opacity-60" : ""}`}
                        >
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                                    {user.image ? (
                                        <Image src={user.image} alt={user.name} fill sizes="48px" className="object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
                                            {user.name.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold">{user.name}</h3>
                                        {!user.discharged && (
                                            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600">
                                                Desactivada
                                            </span>
                                        )}
                                        {!user.emailVerified && (
                                            <span className="rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                                Email sin verificar
                                            </span>
                                        )}
                                    </div>
                                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                        <span>Alta: {fmtDate.format(user.createdAt)}</span>
                                        <span>{user._count.ticketsOwner} entradas</span>
                                        {user.userOnGuilds.length === 0 && <span>Usuario común (sin organización)</span>}
                                    </div>

                                    {user.userOnGuilds.length > 0 && (
                                        <ul className="flex flex-col gap-2 pt-1">
                                            {user.userOnGuilds.map((m) => (
                                                <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-background/60 px-3 py-2 text-sm">
                                                    <Link href={`/admin/organizations/${m.guild.id}/edit`} className="font-medium hover:underline">
                                                        {m.guild.name}
                                                    </Link>
                                                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${roleClasses[m.role]}`}>
                                                        {roleLabels[m.role]}
                                                    </span>
                                                    {m.status !== "ACCEPTED" && (
                                                        <span className="text-xs text-muted-foreground">({m.status === "PENDING" ? "invitación pendiente" : m.status.toLowerCase()})</span>
                                                    )}
                                                    {m.role === Role.EMPLOYEE && (
                                                        <span className="text-xs text-muted-foreground">{m._count.employeeOnEvent} eventos asignados</span>
                                                    )}
                                                    <div className="ml-auto flex items-center gap-2">
                                                        <form action={changeMembershipRole.bind(null, m.id, returnTo)} className="flex items-center gap-1">
                                                            <select
                                                                name="role"
                                                                defaultValue={m.role}
                                                                className="h-8 rounded-md border bg-background px-2 text-xs"
                                                                aria-label="Cambiar rol"
                                                            >
                                                                {(Object.keys(roleLabels) as Role[]).map((r) => (
                                                                    <option key={r} value={r}>{roleLabels[r]}</option>
                                                                ))}
                                                            </select>
                                                            <Button size="sm" variant="ghost" type="submit" className="h-8 px-2 text-xs">Cambiar</Button>
                                                        </form>
                                                        <ConfirmActionButton
                                                            action={removeMembership.bind(null, m.id, returnTo)}
                                                            trigger={<><X className="mr-1 h-3.5 w-3.5" /> Quitar</>}
                                                            title={`¿Quitar a ${user.name} de ${m.guild.name}?`}
                                                            description="Perderá el acceso a la organización y sus asignaciones a eventos quedarán dadas de baja. Podrá ser invitado de nuevo más adelante."
                                                            confirmLabel="Sí, quitar"
                                                            destructive
                                                            className="h-8 border-orange-500/40 px-2 text-xs text-orange-600 hover:bg-orange-500/10"
                                                        />
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">
                                {user.discharged ? (
                                    <ConfirmActionButton
                                        action={toggleUserActive.bind(null, user.id, true, returnTo)}
                                        trigger={<><UserX className="mr-1 h-3.5 w-3.5" /> Desactivar cuenta</>}
                                        title={`¿Desactivar la cuenta de ${user.name}?`}
                                        description="No podrá iniciar sesión en la web ni en la app, y sus sesiones activas en el celular dejarán de funcionar. Sus entradas y datos se conservan; podés reactivarla cuando quieras."
                                        confirmLabel="Sí, desactivar"
                                        destructive
                                    />
                                ) : (
                                    <form action={toggleUserActive.bind(null, user.id, false, returnTo)}>
                                        <Button size="sm" type="submit" className="gap-1.5">
                                            <UserCheck className="h-3.5 w-3.5" /> Reactivar cuenta
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">Página {page} de {totalPages}</p>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" disabled={page <= 1} asChild={page > 1}>
                                {page > 1 ? (
                                    <Link href={qs({ page: page - 1 })}><ChevronLeft className="mr-1 h-4 w-4" /> Anterior</Link>
                                ) : (
                                    <span><ChevronLeft className="mr-1 h-4 w-4" /> Anterior</span>
                                )}
                            </Button>
                            <Button size="sm" variant="outline" disabled={page >= totalPages} asChild={page < totalPages}>
                                {page < totalPages ? (
                                    <Link href={qs({ page: page + 1 })}>Siguiente <ChevronRight className="ml-1 h-4 w-4" /></Link>
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
