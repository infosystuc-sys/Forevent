"use client"

import { Button } from "@forevent/ui/button"
import { Input } from "@forevent/ui/input"
import { Label } from "@forevent/ui/label"
import { useRouter } from "next/navigation"

type GuildFormData = {
    id?: string
    name?: string
    email?: string
    phone_number?: string | null
    address?: string
    city?: string
    state?: string
    country?: string
    identifierType?: string
    identifier?: string
    taxType?: string
    userLimit?: number
    commissionRate?: number
    expiresAt?: Date
    status?: string
    discharged?: boolean
    image?: string | null
}

export default function OrganizationForm({
    initialData,
    action,
}: {
    initialData?: GuildFormData
    action: (formData: FormData) => Promise<void>
}) {
    const router = useRouter()
    const isEdit = !!initialData?.id

    const defaultExpires = initialData?.expiresAt
        ? new Date(initialData.expiresAt).toISOString().slice(0, 10)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    return (
        <form action={action} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input id="name" name="name" defaultValue={initialData?.name ?? ""} placeholder="Ej: Forevent SRL" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" defaultValue={initialData?.email ?? ""} placeholder="contacto@empresa.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone_number">Teléfono</Label>
                    <Input id="phone_number" name="phone_number" defaultValue={initialData?.phone_number ?? ""} placeholder="+54 11 1234-5678" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="image">URL de imagen</Label>
                    <Input id="image" name="image" defaultValue={initialData?.image ?? ""} placeholder="https://..." />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                    <Label htmlFor="address">Dirección *</Label>
                    <Input id="address" name="address" defaultValue={initialData?.address ?? ""} placeholder="Calle 123" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input id="city" name="city" defaultValue={initialData?.city ?? ""} placeholder="Buenos Aires" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state">Provincia *</Label>
                    <Input id="state" name="state" defaultValue={initialData?.state ?? ""} placeholder="Buenos Aires" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="country">País *</Label>
                    <Input id="country" name="country" defaultValue={initialData?.country ?? "Argentina"} required />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="identifierType">Tipo de identificador *</Label>
                    <select
                        id="identifierType"
                        name="identifierType"
                        defaultValue={initialData?.identifierType ?? "CUIT"}
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="CUIT">CUIT</option>
                        <option value="CUIL">CUIL</option>
                        <option value="DNI">DNI</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="identifier">Número *</Label>
                    <Input id="identifier" name="identifier" defaultValue={initialData?.identifier ?? ""} placeholder="20-12345678-9" required minLength={8} maxLength={11} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="taxType">Condición impositiva *</Label>
                    <Input id="taxType" name="taxType" defaultValue={initialData?.taxType ?? ""} placeholder="Responsable Inscripto" required />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <div className="space-y-2">
                    <Label htmlFor="userLimit">Límite de usuarios *</Label>
                    <Input id="userLimit" name="userLimit" type="number" min={1} defaultValue={initialData?.userLimit ?? 100} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="commissionRate">Comisión (%) *</Label>
                    <Input id="commissionRate" name="commissionRate" type="number" step="0.1" min={0} max={100} defaultValue={initialData?.commissionRate ?? 10} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="expiresAt">Fecha de vencimiento *</Label>
                    <Input id="expiresAt" name="expiresAt" type="date" defaultValue={defaultExpires} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status">Estado *</Label>
                    <select
                        id="status"
                        name="status"
                        defaultValue={initialData?.status ?? "PENDING"}
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="PENDING">Pendiente</option>
                        <option value="ACCEPTED">Activa</option>
                        <option value="REJECTED">Rechazada</option>
                        <option value="CANCELLED">Cancelada</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Alta / Baja</Label>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="discharged" value="true" defaultChecked={initialData?.discharged !== false} className="h-4 w-4" />
                        <span className="text-sm">Alta (activa)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="discharged" value="false" defaultChecked={initialData?.discharged === false} className="h-4 w-4" />
                        <span className="text-sm">Baja (inactiva)</span>
                    </label>
                </div>
            </div>

            <div className="flex gap-3">
                <Button type="submit">{isEdit ? "Guardar cambios" : "Crear organización"}</Button>
                <Button type="button" variant="outline" onClick={() => router.push("/admin/organizations")}>
                    Cancelar
                </Button>
            </div>
        </form>
    )
}
