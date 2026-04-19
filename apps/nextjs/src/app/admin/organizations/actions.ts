"use server"

import db, { Status } from "@forevent/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const guildSchema = z.object({
    name: z.string().min(2, "Nombre requerido"),
    email: z.string().email("Email inválido").toLowerCase(),
    phone_number: z.string().optional(),
    address: z.string().min(2, "Dirección requerida"),
    city: z.string().min(1, "Ciudad requerida"),
    state: z.string().min(1, "Provincia requerida"),
    country: z.string().min(1, "País requerido"),
    identifierType: z.enum(["DNI", "CUIT", "CUIL"]),
    identifier: z.string().min(8).max(11),
    taxType: z.string().min(1, "Tipo impositivo requerido"),
    userLimit: z.coerce.number().int().min(1),
    commissionRate: z.coerce.number().min(0).max(100),
    expiresAt: z.string().min(1, "Fecha de vencimiento requerida"),
    status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "DRAFT"]),
    discharged: z.coerce.boolean(),
    image: z.string().url().optional().or(z.literal("")),
})

export async function createOrganizationAction(formData: FormData) {
    const raw = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone_number: formData.get("phone_number") || undefined,
        address: formData.get("address"),
        city: formData.get("city"),
        state: formData.get("state"),
        country: formData.get("country"),
        identifierType: formData.get("identifierType"),
        identifier: formData.get("identifier"),
        taxType: formData.get("taxType"),
        userLimit: formData.get("userLimit"),
        commissionRate: formData.get("commissionRate"),
        expiresAt: formData.get("expiresAt"),
        status: formData.get("status"),
        discharged: formData.get("discharged") === "true",
        image: formData.get("image") || undefined,
    }

    const parsed = guildSchema.safeParse(raw)
    if (!parsed.success) {
        throw new Error(parsed.error.issues.map(i => i.message).join(", "))
    }

    const { expiresAt, image, ...data } = parsed.data

    await db.guild.create({
        data: {
            ...data,
            status: data.status as Status,
            expiresAt: new Date(expiresAt),
            image: image || null,
        },
    })

    revalidatePath("/admin/organizations")
    redirect("/admin/organizations?toast=created")
}

export async function updateOrganizationAction(id: string, formData: FormData) {
    const raw = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone_number: formData.get("phone_number") || undefined,
        address: formData.get("address"),
        city: formData.get("city"),
        state: formData.get("state"),
        country: formData.get("country"),
        identifierType: formData.get("identifierType"),
        identifier: formData.get("identifier"),
        taxType: formData.get("taxType"),
        userLimit: formData.get("userLimit"),
        commissionRate: formData.get("commissionRate"),
        expiresAt: formData.get("expiresAt"),
        status: formData.get("status"),
        discharged: formData.get("discharged") === "true",
        image: formData.get("image") || undefined,
    }

    const parsed = guildSchema.safeParse(raw)
    if (!parsed.success) {
        throw new Error(parsed.error.issues.map(i => i.message).join(", "))
    }

    const { expiresAt, image, ...data } = parsed.data

    await db.guild.update({
        where: { id },
        data: {
            ...data,
            status: data.status as Status,
            expiresAt: new Date(expiresAt),
            image: image || null,
        },
    })

    revalidatePath("/admin/organizations")
    redirect("/admin/organizations?toast=updated")
}

export async function deleteOrganizationAction(id: string) {
    await db.guild.update({
        where: { id },
        data: { discharged: false },
    })

    revalidatePath("/admin/organizations")
    redirect("/admin/organizations?toast=deleted")
}

export async function toggleOrganizationStatus(id: string, currentStatus: Status) {
    const next = currentStatus === Status.ACCEPTED ? Status.PENDING : Status.ACCEPTED
    await db.guild.update({
        where: { id },
        data: { status: next },
    })
    revalidatePath("/admin/organizations")
}

export async function permanentDeleteOrganizationAction(id: string) {
    const eventCount = await db.event.count({ where: { guildId: id } })

    if (eventCount > 0) {
        throw new Error("No se puede eliminar una organización que tiene eventos asociados.")
    }

    await db.guild.delete({ where: { id } })

    revalidatePath("/admin/organizations")
    redirect("/admin/organizations?toast=deleted")
}
