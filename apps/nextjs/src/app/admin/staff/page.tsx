import { ShieldCheck, UserCheck, UserX } from "lucide-react"

import { Button } from "@forevent/ui/button"

import { requireStaff } from "~/lib/staff"
import { api } from "~/trpc/server"
import AdminToastListener from "../toast-listener"
import ConfirmActionButton from "../users/confirm-action-button"
import { setStaffActiveAction } from "./actions"
import { CreateStaffForm, ResetPasswordDialog } from "./forms"

export default async function StaffPage() {
    // Next renderiza layout y page en paralelo: el guard del layout no evita que el page
    // consulte datos antes del redirect, así que cada página vuelve a exigir Super Usuario.
    await requireStaff()

    const staff = await api.web.internal.staffList()
    const active = staff.filter((s) => s.discharged)
    const fmtDate = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })

    return (
        <div className="flex flex-col gap-8">
            <AdminToastListener />

            <section className="flex flex-col gap-4 rounded-2xl border bg-card/60 p-6 shadow-sm">
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Panel de administración</p>
                    <h1 className="text-3xl font-semibold tracking-tight">Super Usuarios</h1>
                    <p className="text-muted-foreground">
                        El equipo de Forevent con acceso global: aprueba eventos, gestiona organizaciones y usuarios.
                        Estas cuentas son independientes de las cuentas de la app.
                    </p>
                </div>
            </section>

            <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm">
                <div>
                    <h2 className="text-xl font-semibold">Nuevo Super Usuario</h2>
                    <p className="text-sm text-muted-foreground">
                        Ingresa en <code className="rounded bg-muted px-1">/internal</code> con email y contraseña.
                    </p>
                </div>
                <CreateStaffForm />
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">
                    Equipo{" "}
                    <span className="text-sm font-normal text-muted-foreground">({active.length} activos de {staff.length})</span>
                </h2>

                <div className="space-y-4">
                    {staff.map((s) => (
                        <div
                            key={s.id}
                            className={`flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between ${!s.discharged ? "opacity-60" : ""}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold">{s.name}</h3>
                                        {s.isMe && (
                                            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                                Vos
                                            </span>
                                        )}
                                        {!s.discharged && (
                                            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600">
                                                Desactivado
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{s.email}</p>
                                    <p className="text-xs text-muted-foreground">Alta: {fmtDate.format(s.createdAt)}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <ResetPasswordDialog id={s.id} name={s.name} isMe={s.isMe} />
                                {s.discharged ? (
                                    !s.isMe && (
                                        <ConfirmActionButton
                                            action={setStaffActiveAction.bind(null, s.id, false)}
                                            trigger={<><UserX className="mr-1 h-3.5 w-3.5" /> Desactivar</>}
                                            title={`¿Desactivar a ${s.name}?`}
                                            description="Dejará de poder entrar al panel administrativo. Podés reactivarlo cuando quieras."
                                            confirmLabel="Sí, desactivar"
                                            destructive
                                        />
                                    )
                                ) : (
                                    <form action={setStaffActiveAction.bind(null, s.id, true)}>
                                        <Button size="sm" type="submit" className="gap-1.5">
                                            <UserCheck className="h-3.5 w-3.5" /> Reactivar
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
