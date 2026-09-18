"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { TRPCError } from "@trpc/server"

import { api } from "~/trpc/server"

export interface ActionState {
    error: string | null
}

function messageOf(err: unknown) {
    if (err instanceof TRPCError) return err.message
    if (err instanceof Error) return err.message
    return "Ocurrió un error inesperado."
}

function done(toast: string) {
    revalidatePath("/admin/staff")
    redirect(`/admin/staff?toast=${toast}`)
}

function fail(message: string) {
    revalidatePath("/admin/staff")
    redirect(`/admin/staff?error=${encodeURIComponent(message)}`)
}

// Las mutaciones viven en api.web.internal.* (internalProcedure), así el chequeo de
// Super Usuario y el hash de contraseña quedan en un solo lugar.

export async function createStaffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
    try {
        await api.web.internal.staffCreate({
            name: formData.get("name")?.toString() ?? "",
            email: formData.get("email")?.toString() ?? "",
            password: formData.get("password")?.toString() ?? "",
        })
    } catch (err) {
        return { error: messageOf(err) }
    }
    done("staffCreated")
    return { error: null }
}

export async function setStaffActiveAction(id: string, active: boolean) {
    try {
        await api.web.internal.staffSetActive({ id, active })
    } catch (err) {
        fail(messageOf(err))
    }
    done(active ? "staffActivated" : "staffDeactivated")
}

export async function resetStaffPasswordAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
    const password = formData.get("password")?.toString() ?? ""
    const confirm = formData.get("confirm")?.toString() ?? ""
    if (password !== confirm) {
        return { error: "Las contraseñas no coinciden." }
    }
    try {
        await api.web.internal.staffResetPassword({ id, password })
    } catch (err) {
        return { error: messageOf(err) }
    }
    done("staffPasswordReset")
    return { error: null }
}
