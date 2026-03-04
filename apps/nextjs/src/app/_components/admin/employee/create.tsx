"use client"
import { zodResolver } from '@hookform/resolvers/zod'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import Return from '~/app/_components/return'
import { Icons } from '~/app/_components/ui/icons'
import { Separator } from '~/app/_components/ui/separator'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "~/app/_components/ui/sheet"
import { customdayjs } from '~/lib/constants'
import { api } from '~/trpc/react'
import { Button } from '../../ui/button'
import { CardContent, CardDescription, CardTitle } from '../../ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form'
import { Input } from '../../ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

const formSchema = z.object({
    fileNumber: z.string().optional(),
    joinedAt: z.string().optional(),
    identifierType: z.enum(['DNI', 'CUIT', 'CUIL']),
    identifier: z.string().min(1, { message: "Se requiere un documento" }),
    birthdate: z.string().optional(),
    names: z.string().min(1, { message: "Se requiere un nombre" }),
    lastnames: z.string().min(1, { message: "Se requiere un apellido" }),
    sex: z.enum(['MALE', 'FEMALE', "OTHER"]),
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    role: z.enum(["GENERAL_ADMINISTRATIVE", "LOCATION_ADMINISTRATIVE", "EMPLOYEE"]),
    email: z.string().email({ message: "Ingrese un correo electrónico válido" }).min(1, { message: "Se requiere un correo electrónico" }).toLowerCase(),
    confirmEmail: z.string().email({ message: "Ingrese un correo electrónico válido" }).min(1, { message: "Se requiere un correo electrónico" }).toLowerCase(),
    username: z.string().optional(),
    password: z.string().optional(),
    newUser: z.boolean().optional()
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

function CreateEmployee(data: { guildId: string }) {
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            address: "",
            birthdate: "",
            city: "",
            country: "",
            email: "",
            fileNumber: "",
            identifier: "",
            identifierType: "DNI",
            joinedAt: "",
            lastnames: "",
            names: "",
            password: undefined,
            role: "EMPLOYEE",
            sex: "MALE",
            confirmEmail: "",
            state: "",
            username: undefined,
            newUser: true
        },
        mode: "onChange"
    })

    const utils = api.useUtils()

    const createEmployee = api.web.userOnGuild.createEmployee.useMutation({
        onSuccess: async (res) => {
            console.log(res, "success")
            toast("Empleado creado con exito", {
                description: `Creado a las ${customdayjs().format("HH:mm")}`,
                action: {
                    label: "Cerrar",
                    onClick: () => console.log("cerrar"),
                },
            })
            await utils.web.userOnGuild.getEmployees.invalidate()
            router.back()
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape, "error")
            toast("Ocurrio un error", {
                description: `${error.message}`,
                action: {
                    label: "Cerrar",
                    onClick: () => console.log("cerrar"),
                },
            })
        }
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        console.log(values, "VALUES DEL FORM!")
        const { confirmEmail, ...correctedValues } = values
        createEmployee.mutate({ ...correctedValues, guildId: data.guildId })
    }

    return (
        <div className='flex flex-1 justify-center items-center'>
            <div className='max-w-6xl w-full'>
                <Return />
                <CardContent className='w-full pt-5 space-y-4'>
                    <CardTitle>Crear o invitar un empleado</CardTitle>
                    <CardDescription className=''>
                        Aqui puedes ingresar a un empleado a tu organización y darle un rol. Si este ya esta registrado en Forevent, se le enviara una invitación a su correo electrónico. Si no, se le creara una cuenta y se le enviara un correo electrónico con sus credenciales.
                        Los campos con (*) son obligatorios.
                    </CardDescription>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-bold">Información personal</h3>
                                </div>
                                <Separator />
                            </div>
                            <div className="flex w-full justify-start gap-5">
                                <FormField
                                    control={form.control}
                                    name="names"
                                    render={({ field }) => (
                                        <FormItem className='w-full'>
                                            <FormLabel>Nombres *</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastnames"
                                    render={({ field }) => (
                                        <FormItem className='w-full'>
                                            <FormLabel>Apellidos *</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="birthdate"
                                    render={({ field }) => (
                                        <FormItem className='w-full'>
                                            <FormLabel>Fecha de nacimiento</FormLabel>
                                            <FormControl>
                                                <Input type='date' max={customdayjs().subtract(18, "year").format("YYYY-MM-DD")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex w-full justify-start gap-5">
                                <FormField
                                    control={form.control}
                                    name="sex"
                                    render={({ field }) => (
                                        <FormItem {...field} className="w-full">
                                            <FormLabel>Sexo *</FormLabel>
                                            <FormControl>
                                                <Select value={field.value} onValueChange={(typ) => field.onChange(typ)}>
                                                    <SelectTrigger className="">
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup className="overflow-y-auto max-h-[10rem]">
                                                            <SelectItem value="MALE">Masculino</SelectItem>
                                                            <SelectItem value="FEMALE">Femenino</SelectItem>
                                                            <SelectItem value="OTHER">Otro</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="identifierType"
                                    render={({ field }) => (
                                        <FormItem {...field} className="w-full">
                                            <FormLabel className="">Tipo de documento *</FormLabel>
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
                                            {/* <FormDescription className="w-max">
                                                    Obligatorio.
                                                </FormDescription> */}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="identifier"
                                    render={({ field }) => (
                                        <FormItem className="w-full" >
                                            <FormLabel>Número de documento *</FormLabel>
                                            <Input {...field} maxLength={11} id="identifier" type="text" placeholder="40320921" />
                                            <FormDescription className="w-max">
                                                Solo números, sin puntos ni comas.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-bold">Información de dirección</h3>
                                </div>
                                <Separator />
                            </div>
                            <div className="flex w-full justify-start gap-5">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className='w-full'>
                                            <FormLabel>Domicilio</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex w-full justify-start gap-5">
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem className='w-full '>
                                            <FormLabel>País</FormLabel>
                                            <FormControl>
                                                <div className='w-full flex-1 rounded-md border px-2'>
                                                    <CountryDropdown
                                                        defaultOptionLabel='Seleccionar'
                                                        value={field.value!}
                                                        onChange={(val) => field.onChange(val)}
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
                                        <FormItem className='w-full'>
                                            <FormLabel>Provincia</FormLabel>
                                            <FormControl>
                                                <div className='w-full flex-1 rounded-md border px-2'>
                                                    <RegionDropdown
                                                        defaultOptionLabel='Seleccionar'
                                                        country={form.watch('country')!}
                                                        value={field.value!}
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
                                        <FormItem className='w-full'>
                                            <FormLabel>Ciudad</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-bold">Informacion de cuenta</h3>
                                </div>
                                <Separator />
                            </div>
                            <div className="flex w-full items-center justify-start gap-5">
                                <FormField
                                    control={form.control}
                                    name="joinedAt"
                                    render={({ field }) => (
                                        <FormItem className='w-full'>
                                            <FormLabel>Fecha de contratación</FormLabel>
                                            <FormControl>
                                                <Input type='date' max={customdayjs().format("YYYY-MM-DD")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="fileNumber"
                                    render={({ field }) => (
                                        <FormItem className='w-full'>
                                            <FormLabel>Número de Legajo</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className='flex items-end justify-center gap-2 w-full'>
                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem className='w-full'>
                                                <FormLabel>Rol *</FormLabel>
                                                <FormControl>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Seleccionar" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup className="overflow-y-auto max-h-[10rem] w-full">
                                                                <SelectItem value="GENERAL_ADMINISTRATIVE">Administrador general</SelectItem>
                                                                <SelectItem value="LOCATION_ADMINISTRATIVE">Administrador local</SelectItem>
                                                                <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <Button variant="ghost">
                                                <InfoCircledIcon className='w-6 h-6' />
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent className='space-y-5'>
                                            <SheetHeader>
                                                <SheetTitle>Roles en Myassitance</SheetTitle>
                                                {/* <SheetDescription>
                                                        Existen 5 roles en Forevent, cada uno con diferentes permisos y funciones.
                                                    </SheetDescription> */}
                                            </SheetHeader>
                                            <div className='space-y-1'>
                                                <h3 className="text-lg font-bold">Administrador General</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Tiene acceso a toda la organización, excepto la facturación y la baja de la organización.
                                                    Puede dar de alta y baja empleados, ubicaciones, marcajes, novedades, cronogramas y más.
                                                </p>
                                            </div>
                                            <Separator />
                                            <div className='space-y-1'>
                                                <h3 className="text-lg font-bold">Administrador Local</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Tiene acceso a ubicaciónes específicas, puede crear marcajes y novedades para los empleados de ese lugar.
                                                </p>
                                            </div>
                                            <Separator />
                                            <div className='space-y-1'>
                                                <h3 className="text-lg font-bold">Empleado</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Tiene acceso a la aplicación móvil, crea sus marcajes y no tiene acceso a la plataforma web.
                                                </p>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            </div>
                            <div className="flex w-full items-start gap-5">
                                {/* <FormField
                                    control={form.control}
                                    name="newUser"
                                    render={({ field }) => (
                                        <FormItem className=" items-center justify-between rounded-lg pt-7">
                                            <div className='flex gap-4'>
                                                <FormLabel className="text-base w-max">
                                                    Cuenta nueva?
                                                </FormLabel>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormDescription>
                                                Si el empleado ya tiene una cuenta, desactiva esta opción.
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                /> */}
                                <FormField
                                    control={form.control}
                                    name="username"
                                    disabled={!form.watch("newUser")}
                                    render={({ field }) => (
                                        <FormItem className='w-full'>
                                            <FormLabel>Nombre de usuario</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormDescription className="">
                                                Si no escoges uno, utilizaremos el numero de documento como nombre de usuario.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className='w-full'>
                                            <FormLabel>Correo electrónico *</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder='example@gmail.com' />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmEmail"
                                    render={({ field }) => (
                                        <FormItem className='w-full'>
                                            <FormLabel>Repetir correo electrónico *</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder='example@gmail.com' />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className='flex justify-center gap-20 w-full pt-10'>
                                <Button type='submit' disabled={createEmployee.isPending}>
                                    {createEmployee.isPending ?
                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                        :
                                        "Crear empleado"
                                    }
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </div>

        </div >
    )
}

export default CreateEmployee