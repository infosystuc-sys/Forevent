"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import type { Session } from "@forevent/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CountryDropdown, RegionDropdown } from "react-country-region-selector"
import { toast } from "sonner"
import Return from "~/app/_components/return"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle
} from "~/app/_components/ui/alert-dialog"
import { Button } from "~/app/_components/ui/button"
import {
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "~/app/_components/ui/card"
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
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "~/app/_components/ui/select"
import { customdayjs } from "~/lib/constants"
import { api } from "~/trpc/react"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"

const TAX_TYPES = [
    "IVA Responsable Inscripto",
    "IVA Responsable no Inscripto",
    "IVA no Responsable",
    "IVA Sujeto Exento",
    "Consumidor Final",
    "Responsable Monotributo",
    "Sujeto no Categorizado",
    "Proveedor del Exterior",
    "Cliente del Exterior",
    "IVA Liberado – Ley Nº 19.640",
    "IVA Responsable Inscripto – Agente de Percepción",
    "Pequeño Contribuyente Eventual",
    "Monotributista Social",
    "Pequeño Contribuyente Eventual Social",
]

export const createGuildSchema = z.object({
    name: z.string().min(1, { message: "Este campo es obligatorio" }),
    taxType: z.string().min(1, { message: "Este campo es obligatorio" }),
    identifier: z.string().max(11).min(8, { message: "Este campo es obligatorio" }),
    identifierType: z.enum(['DNI', 'CUIT', 'CUIL']),
    email: z.string().email({ message: "Debes ingresar un correo electrónico válido" }).toLowerCase(),
    confirmEmail: z.string().email({ message: "Debes ingresar un correo electrónico válido" }).toLowerCase(),
    address: z.string().min(1, { message: "Este campo es obligatorio" }),
    country: z.string().min(1, { message: "Este campo es obligatorio" }),
    state: z.string().min(1, { message: "Este campo es obligatorio" }),
    city: z.string().min(1, { message: "Este campo es obligatorio" }),
    image: z.string().url().optional()
}).refine((data) => data.email === data.confirmEmail, {
    message: "Los correos no coinciden",
    path: ["confirmEmail"], // path of error
}).refine((data) => {
    switch (data.identifierType) {
        case "CUIL":
            if (data.identifier.length !== 11) {
                return false
            } else {
                return true
            }
        case "CUIT":
            if (data.identifier.length !== 11) {
                return false
            } else {
                return true
            }
        case "DNI":
            if (data.identifier.length !== 8) {
                return false
            } else {
                return true
            }
        default:
            return false
    }
}, {
    message: `Revise la cantidad de digitos del documento`,
    path: ["identifier"],
})

const verifySchema = z.object({ validationCode: z.string().min(1, { message: "Debes completar este campo.", }), })


export function CreateGuildForm({ session }: { session: Session | null }) {
    console.log(session, "sesion")
    const router = useRouter();
    const utils = api.useUtils()
    const [open, setOpen] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)

    const createGuild = api.web.guild.createGuild.useMutation({
        onSuccess: (res) => {
            createValidation.mutate({ email: form.watch("email"), type: "GUILD" })
            console.log(res, "success create guild")
            setOpen(true)
            setLoading(false)
        },
        onError: (error) => {
            setLoading(false)
            console.log(error.data, error.message, error.shape, "error")
            if (error.data?.code === "CONFLICT") {
                form.setError("email", { message: error.message })
            } else if (error.data?.code === "INTERNAL_SERVER_ERROR") {
                form.setError("name", { message: error.message })
            }
        }
    })

    const createValidation = api.web.auth.createValidation.useMutation({
        onSuccess: (res) => {
            console.log(res, "success created validation")
            setLoading(false)
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape, "error")
            if (error.data?.code === "CONFLICT") {
                router.push("/v1")
            }
            toast("Ocurrio un error", {
                description: error.message,
                action: {
                    label: "Cerrar", onClick: () => {
                        // console.log("close!")
                    }
                }
            })
        }
    })

    const confirmEmail = api.web.auth.submitValidation.useMutation({
        onSuccess: async (res) => {
            setOpen(false)
            console.log(res, "success")
            toast("Organización creada con exito", {
                description: `Creada a las ${customdayjs().format("HH:mm")})}`,
                action: {
                    label: "Cerrar",
                    onClick: () => console.log("cerrar"),
                },
            })
            await utils.web.guild.getGuilds.invalidate()
            await utils.web.auth.getIsVerified.invalidate()
            router.push("/v1")
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape, "error")
            if (error.data?.code === "BAD_REQUEST") {
                verifyForm.setError("validationCode", { message: error.message })
            } else {
                toast("Ocurrio un error", {
                    description: error.message,
                    action: {
                        label: "Cerrar", onClick: () => {
                            // console.log("close!")
                        }
                    }
                })
            }
        }
    })

    const form = useForm<z.infer<typeof createGuildSchema>>({
        resolver: zodResolver(createGuildSchema),
        defaultValues: {
            name: "",
            taxType: "",
            identifier: "",
            identifierType: "DNI",
            email: "",
            address: "",
            country: "",
            state: "",
            confirmEmail: "",
            city: "",
            image: undefined
        },
        mode: "onChange"
    })

    const verifyForm = useForm<z.infer<typeof verifySchema>>({
        resolver: zodResolver(verifySchema),
        defaultValues: {
            validationCode: '',
        },
        mode: "onChange"
    })

    function onSubmit(data: z.infer<typeof createGuildSchema>) {
        setLoading(true)
        console.log('pressed!', data)
        const { confirmEmail, ...correctedValues } = data
        createGuild.mutate({ ...correctedValues, ownerEmail: session?.user?.email! })
    }

    async function onSubmitValidation(data: z.infer<typeof verifySchema>) {
        setLoading(true)
        console.log(JSON.stringify(data), "validation")
        confirmEmail.mutate({ code: data.validationCode, type: "GUILD", validationId: createValidation?.data! })
    }

    async function onResend() {
        createValidation.mutate({ email: form.watch("email"), type: "GUILD" })
    }

    return (
        <div className='flex flex-1 py-5 justify-center items-center'>
            <div className='max-w-6xl w-full'>
                <Return />
                <CardHeader>
                    <CardTitle>Crea una organización</CardTitle>
                    <CardDescription>Completa el formulario. Los campos con (*) son obligatorios</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <Form {...form}>
                        <form id="requestform" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="flex w-full items-start justify-center gap-5">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="w-full" {...field}>
                                            <FormLabel>Nombre de la organizacion *</FormLabel>
                                            <Input name="name" id="name" type="text" placeholder="Enterprise" />
                                            <FormDescription>
                                                Obligatorio.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem  {...field} className="w-full">
                                            <FormLabel>Foto</FormLabel>
                                            <FormControl className="">
                                                <div className="flex items-center justify-center">
                                                    {loading && !form.watch("image") ?
                                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                                        :
                                                        form.watch("image") ?
                                                            <div className="flex w-full items-start justify-start space-y-4 gap-5">
                                                                <Avatar className="h-20 w-20">
                                                                    <AvatarImage style={{ objectFit: "cover" }} src={form.watch("image") ?? ""} alt="profile-image" />
                                                                    <AvatarFallback>
                                                                        <Icons.spinner className=" h-5 w-5 animate-spin" />
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <Button type="button" variant={"outline"} onClick={() => {
                                                                    form.setValue("image", undefined)
                                                                }}>
                                                                    Cambiar imagen
                                                                </Button>
                                                            </div>
                                                            :
                                                            <Input
                                                                id="image"
                                                                type="file"
                                                                accept=".jpg, .jpeg"
                                                                onChange={async (e) => {
                                                                    setLoading(true)
                                                                    console.log(e.target.files, "EVENT")
                                                                    if (e.target.files?.[0]) {
                                                                        const file = e.target.files[0]

                                                                        const response = await fetch(
                                                                            process.env.NEXT_PUBLIC_BASE_URL + '/api/upload',
                                                                            {
                                                                                method: 'POST',
                                                                                headers: {
                                                                                    'Content-Type': 'application/json',
                                                                                },
                                                                                body: JSON.stringify({ filename: file.name, contentType: file.type }),
                                                                            }
                                                                        )

                                                                        if (response.ok) {
                                                                            const { url, fields } = await response.json()

                                                                            console.log(url, "url", fields, "fields")

                                                                            const formData = new FormData()
                                                                            Object.entries(fields).forEach(([key, value]) => {
                                                                                formData.append(key, value as string)
                                                                            })
                                                                            formData.append('file', file)

                                                                            const uploadResponse = await fetch(url, {
                                                                                method: 'POST',
                                                                                body: formData,
                                                                            })

                                                                            if (uploadResponse.ok) {
                                                                                form.setValue("image", "https://d2l7xb0l2x2ws7.cloudfront.net/" + fields.key)
                                                                                console.log("https://d2l7xb0l2x2ws7.cloudfront.net/" + fields.key, "   URL DEL ARCHIVO")
                                                                                // alert('Upload successful!')
                                                                            } else {
                                                                                console.error('S3 Upload Error:', await uploadResponse.text())
                                                                                // alert('Upload failed.')
                                                                            }
                                                                        } else {
                                                                            console.error('Failed to get pre-signed URL:', await response.text())
                                                                        }
                                                                    }
                                                                    setLoading(false)
                                                                }
                                                                }
                                                            />
                                                    }
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Solo se permiten archivos .jpg y .jpeg de hasta 3MB.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex w-full items-start gap-5">
                                <FormField
                                    control={form.control}
                                    name="identifierType"
                                    render={({ field }) => (
                                        <FormItem {...field} className="w-full">
                                            <FormLabel className="w-max">Tipo de documento *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup className="overflow-y-auto max-h-[10rem]">
                                                        <SelectItem value="DNI">DNI</SelectItem>
                                                        <SelectItem value="CUIT">CUIT</SelectItem>
                                                        <SelectItem value="CUIL">CUIL</SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="w-max">
                                                Obligatorio.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="identifier"
                                    render={({ field }) => (
                                        <FormItem className="" {...field}>
                                            <FormLabel>Número de documento *</FormLabel>
                                            <Input name="identifier" maxLength={11} id="identifier" type="text" placeholder="40320921" />
                                            <FormDescription className="w-max">
                                                Solo números, sin puntos ni comas.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="w-full" {...field}>
                                            <FormLabel>Correo electrónico *</FormLabel>
                                            <Input name="email" id="email" type="email" placeholder="johndoe@example.com" />
                                            <FormDescription>
                                                Obligatorio.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmEmail"
                                    render={({ field }) => (
                                        <FormItem className="w-full" {...field}>
                                            <FormLabel>Repetir correo electrónico *</FormLabel>
                                            <Input name="email" id="email" type="email" placeholder="johndoe@example.com" />
                                            <FormDescription>
                                                Obligatorio.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex items-center justify-start gap-5">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className="w-full" {...field}>
                                            <FormLabel>Dirección *</FormLabel>
                                            <Input name="address" id="address" type="text" placeholder="Ej: Av. Cabildo 2000" />
                                            <FormDescription>
                                                Obligatorio.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}

                                />
                                <FormField
                                    control={form.control}
                                    name="taxType"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Tipo de IVA *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup className="overflow-y-auto max-h-[10rem]">
                                                        {TAX_TYPES.map((taxType, index) =>
                                                            <SelectItem key={index.toString()} value={taxType}>{taxType}</SelectItem>
                                                        )}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Obligatorio.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className='flex gap-5'>
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>País *</FormLabel>
                                            <FormControl>
                                                <div className='w-full flex-1 rounded-md border px-2'>
                                                    <CountryDropdown
                                                        value={field.value}
                                                        onChange={(val) => field.onChange(val)}
                                                        defaultOptionLabel="Seleccionar"
                                                        classes='py-[.6rem] w-full text-sm'
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Provincia *</FormLabel>
                                            <FormControl>
                                                <div className='w-full flex-1 rounded-md border px-2'>
                                                    <RegionDropdown
                                                        country={form.watch('country')}
                                                        value={field.value}
                                                        defaultOptionLabel="Seleccionar"
                                                        classes='py-[.6rem] w-full text-sm'
                                                        onChange={(val) => field.onChange(val)} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Ciudad *</FormLabel>
                                            <FormControl>
                                                <div className='w-full flex-1'>
                                                    <Input placeholder="Ej: CABA" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex items-center justify-center gap-5 mt-5">
                                <Button disabled={loading || createValidation.isPending || createGuild.isPending} type="submit" className="">
                                    {loading || createValidation.isPending || createGuild.isPending ?
                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                        :
                                        "Crear organización"
                                    }
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </div>
            <AlertDialog open={open} >
                <AlertDialogContent className="sm:max-w-[425px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirma el correo de la organización</AlertDialogTitle>
                        <AlertDialogDescription>
                            Para crear la organización es necesario confirmar primero el correo electrónico de esta.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Form {...verifyForm}>
                        <form id="verify" onSubmit={verifyForm.handleSubmit(onSubmitValidation)} className="w-full space-y-6">
                            <FormField
                                control={verifyForm.control}
                                name="validationCode"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Código de verificación</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: 10234" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Revisa la bandeja de entrada del correo de la organización
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className='flex items-center justify-center'>
                                <p className='text-neutral-400 text-sm'>No te llego el codigo?</p>
                                <Button variant={"link"} onClick={onResend}>
                                    Enviar otro código
                                </Button>
                            </div>
                            <div className="flex justify-center items-center">
                                <Button type="submit" className="" form="verify" disabled={confirmEmail.isPending || createValidation.isPending}>
                                    {confirmEmail.isPending || createValidation.isPending ?
                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                        :
                                        "Confirmar"
                                    }
                                </Button>
                            </div>
                        </form>
                    </Form>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
