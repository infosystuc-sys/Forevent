"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { TAX_TYPES } from "~/app/_components/admin/guild/create"
import { Button } from "~/app/_components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/app/_components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/app/_components/ui/form"
import { Icons } from "~/app/_components/ui/icons"
import { Input } from "~/app/_components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/app/_components/ui/select"
import { api } from "~/trpc/react"

/** Longitud exigida por tipo de identificación fiscal. */
const IDENTIFIER_LENGTH = { DNI: 8, CUIT: 11, CUIL: 11 } as const

const schema = z
    .object({
        name: z.string().min(1, "Este campo es obligatorio"),
        ownerEmail: z.string().email("Ingresá un correo válido").toLowerCase(),
        email: z.string().email("Ingresá un correo válido").toLowerCase(),
        identifierType: z.enum(["DNI", "CUIT", "CUIL"]),
        identifier: z.string().min(8, "Mínimo 8 dígitos").max(11, "Máximo 11 dígitos"),
        taxType: z.string().min(1, "Este campo es obligatorio"),
        address: z.string().min(1, "Este campo es obligatorio"),
        city: z.string().min(1, "Este campo es obligatorio"),
        state: z.string().min(1, "Este campo es obligatorio"),
        country: z.string().min(1, "Este campo es obligatorio"),
    })
    .refine((d) => d.identifier.length === IDENTIFIER_LENGTH[d.identifierType], {
        message: "La cantidad de dígitos no corresponde al tipo elegido",
        path: ["identifier"],
    })

export default function CreateGuildDialog() {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            ownerEmail: "",
            email: "",
            identifierType: "CUIT",
            identifier: "",
            taxType: "",
            address: "",
            city: "",
            state: "",
            country: "Argentina",
        },
    })

    const createGuild = api.web.guild.createGuild.useMutation({
        onSuccess: (res) => {
            setOpen(false)
            form.reset()
            toast("Organización creada", {
                description: `${res?.name ?? "La organización"} quedó activa y su dueño ya puede ingresar.`,
            })
            router.refresh()
        },
        onError: (error) => {
            // El caso más frecuente: el dueño todavía no tiene cuenta en Forevent.
            if (error.data?.code === "NOT_FOUND") {
                form.setError("ownerEmail", { message: error.message })
                return
            }
            toast.error(error.message)
        },
    })

    function onSubmit(values: z.infer<typeof schema>) {
        createGuild.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva organización
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Nueva organización</DialogTitle>
                    <DialogDescription>
                        El dueño tiene que tener una cuenta de Forevent creada con ese correo.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Bar Irlanda" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="ownerEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo del dueño</FormLabel>
                                    <FormControl>
                                        <Input placeholder="dueno@example.com" type="email" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Queda como OWNER y podrá gestionar la organización.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo de la organización</FormLabel>
                                    <FormControl>
                                        <Input placeholder="contacto@barirlanda.com" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-3 gap-3">
                            <FormField
                                control={form.control}
                                name="identifierType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CUIT">CUIT</SelectItem>
                                                <SelectItem value="CUIL">CUIL</SelectItem>
                                                <SelectItem value="DNI">DNI</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="identifier"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Número</FormLabel>
                                        <FormControl>
                                            <Input inputMode="numeric" placeholder="20123456789" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="taxType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Condición fiscal</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Elegí una condición" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {TAX_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {t}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Av. Aconquija 1702" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-3 gap-3">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ciudad</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Yerba Buena" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Provincia</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Tucumán" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>País</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={createGuild.isPending}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createGuild.isPending}>
                                {createGuild.isPending ? (
                                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Crear organización
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
