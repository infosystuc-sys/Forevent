"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import db, { Role } from "@forevent/db"

import { assertStaffAction } from "~/lib/staff"

const ROLES = Object.values(Role)

/** Vuelve a la lista conservando búsqueda/filtro/página y mostrando un toast. */
function back(toast: string, returnTo: string) {
    revalidatePath("/admin/users")
    const sep = returnTo.includes("?") ? "&" : "?"
    redirect(`${returnTo}${sep}toast=${toast}`)
}

/**
 * Desactivar / reactivar una cuenta (PDF §7: el Super Usuario gestiona usuarios).
 * Una cuenta desactivada no puede iniciar sesión en la web ni en la app, y sus
 * sesiones móviles vigentes dejan de ser válidas.
 */
export async function toggleUserActive(userId: string, currentlyActive: boolean, returnTo: string) {
    const staff = await assertStaffAction()

    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } })
    if (!user) throw new Error("Usuario no encontrado.")
    if (currentlyActive && user.email.toLowerCase() === staff.email.toLowerCase()) {
        throw new Error("No podés desactivar tu propia cuenta.")
    }

    await db.user.update({
        where: { id: userId },
        data: { discharged: !currentlyActive },
    })

    back(currentlyActive ? "userDeactivated" : "userActivated", returnTo)
}

/**
 * Quitar a un usuario de una organización (PDF §7: gestionar empleados).
 * Se marca la membresía como dada de baja y se desactivan sus asignaciones a eventos,
 * así deja de poder escanear en la app.
 */
export async function removeMembership(userOnGuildId: string, returnTo: string) {
    await assertStaffAction()

    await db.$transaction([
        db.userOnGuild.update({
            where: { id: userOnGuildId },
            data: { discharged: false, status: "CANCELLED" },
        }),
        db.employeeOnEvent.updateMany({
            where: { userOnGuildId, discharged: true },
            data: { discharged: false },
        }),
    ])

    back("membershipRemoved", returnTo)
}

/** Cambiar el rol de un usuario dentro de una organización. */
export async function changeMembershipRole(userOnGuildId: string, returnTo: string, formData: FormData) {
    await assertStaffAction()

    const role = formData.get("role")?.toString()
    if (!role || !ROLES.includes(role as Role)) {
        throw new Error("Rol inválido.")
    }

    await db.userOnGuild.update({
        where: { id: userOnGuildId },
        data: { role: role as Role },
    })

    back("roleUpdated", returnTo)
}
