"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "~/app/_components/ui/alert-dialog"
import { customdayjs } from "~/lib/constants"
import { api } from "~/trpc/react"
import { Button } from "../../ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form"
import { Icons } from "../../ui/icons"
import { Input } from "../../ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"

const employeeSchema = z.object({
    email: z.string().email({ message: "El email no es válido" }).toLowerCase(),
    role: z.enum(["MANAGER", "EMPLOYEE"]),
})

export function InviteEmployee() {
    const [open, setOpen] = useState(false)
    const params = useParams()
    const router = useRouter()
    const utils = api.useUtils()
    const form = useForm<z.infer<typeof employeeSchema>>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            email: "",
            role: "EMPLOYEE"
        },
        mode: "onChange"
    })

    const onSubmit = async (values: z.infer<typeof employeeSchema>) => {
        console.log(values, "VALUES DEL FORM!")
        createInvite.mutate({ ...values, guildId: params?.guildId! as string })
    }

    const createInvite = api.web.userOnGuild.createInvite.useMutation({
        onSuccess: async (res) => {
            await utils.web.userOnGuild.getGuildInvites.invalidate()
            console.log(res, "res")
            setOpen(false)
            toast("Empleado invitado con exito", {
                description: `Invitado a las ${customdayjs().format("HH:mm")}`,
                action: {
                    label: "Cerrar",
                    onClick: () => console.log("cerrar"),
                },
            })
            router.push(`/v1/${params?.guildId}/settings/invites`)
        },
        onError: (error) => {
            console.log(error, "error")
            if (error.data?.code === "NOT_FOUND") {
                form.setError("email", { message: error.message })
            }
            if (error.data?.code === "CONFLICT") {
                form.setError("email", { message: error.message })
            }
        },
    })

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="default">Invitar empleado</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Invitar a un empleado a la organización</AlertDialogTitle>
                    <AlertDialogDescription>
                        Deberas ingresar el correo electrónico del usuario de forevent y el rol que tendrá.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="flex w-full justify-start gap-5">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className='w-full'>
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="example@example.com" type="email" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Asegúrate de que el email sea correcto
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem {...field} className="w-full">
                                        <FormLabel>Rol *</FormLabel>
                                        <FormControl>
                                            <Select value={field.value} onValueChange={(typ) => field.onChange(typ)}>
                                                <SelectTrigger className="">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup className="overflow-y-auto max-h-[10rem]">
                                                        <SelectItem value="MANAGER">Gerente</SelectItem>
                                                        <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <Button type="submit" disabled={createInvite.isPending}>
                                {createInvite.isPending ?
                                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                    :
                                    "Invitar"
                                }
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </Form>
            </AlertDialogContent>
        </AlertDialog>
    )
}