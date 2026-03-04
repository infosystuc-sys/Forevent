"use client"

import * as React from "react"
import * as z from "zod"

import { Session } from "@forevent/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "~/app/_components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "~/app/_components/ui/form"
import { Icons } from "~/app/_components/ui/icons"
import { Input } from "~/app/_components/ui/input"
import { api } from "~/trpc/react"

const FormSchema = z.object({
    password: z.string({ required_error: "Debes ingresar una contraseña" }).min(8, {
        message: "No cumple con los requisitos",
    }),
    confirmPassword: z.string({ required_error: "Debes ingresar una contraseña" }).min(8, {
        message: "No cumple con los requisitos",
    })
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"], // path of error
})


export function ChangePasswordForm({ session }: { session: Session | null }) {
    const [showPassword, setShowPassword] = React.useState<boolean>(false)
    const router = useRouter();
    const utils = api.useUtils()

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            password: '',
            confirmPassword: ''
        }
    })

    const newpass = api.web.auth.changePassword.useMutation({
        onSuccess: async (res) => {
            console.log(res, "success");
            await utils.web.userOnGuild.getInvites.invalidate()
            await utils.web.guild.getGuilds.invalidate()
            await utils.web.auth.getIsVerified.invalidate()
            toast("Exito", {
                description: "Contraseña reestablecida con exito",
                action: {
                    label: "Cerrar", onClick: () => {
                        // console.log("close!")
                    }
                }
            })
            router.back()
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape, "error")
            if (error.data?.code === "NOT_FOUND") {
                toast("Ocurrio un error", {
                    description: "La solicitud de cambio de contraseña no existe o ya fue utilizada",
                    action: {
                        label: "Cerrar", onClick: () => {
                            console.log("close!")
                        }
                    }
                })
            }
        }
    })

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        console.log(JSON.stringify(data))
        newpass.mutate({ email: session?.user.email! as string, password: data.password })
    }

    return (
        <div>
            {newpass.isSuccess ?
                <div className="space-y-4">
                    <div className="flex flex-col text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Contraseña cambiada
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Tu contraseña ha sido cambiada exitosamente
                        </p>
                    </div>
                    <div className="flex flex-col text-center">
                        <Button variant="outline" onClick={() => { router.push("/login") }}>
                            Iniciar sesión
                        </Button>
                    </div>
                </div>
                :
                <div className={"w-full space-y-5"}>
                    <div className='flex items-center justify-between'>
                        <div className="flex flex-col items-center w-full justify-center space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Crear nueva contraseña
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Ingresa tu nueva contraseña
                            </p>
                        </div>
                    </div>
                    <Form {...form}>
                        <form id="register" onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input
                                                    placeholder="********"
                                                    type={showPassword ? "text" : "password"}
                                                    autoCapitalize="none"
                                                    autoComplete="password"
                                                    autoCorrect="off"
                                                    {...field} />
                                            </FormControl>
                                            <span>
                                                <Button variant="outline" size="icon" type="button" onClick={() => { setShowPassword(!showPassword) }}>
                                                    {showPassword ?
                                                        <EyeClosedIcon className="w-4 h-4" />
                                                        :
                                                        <EyeOpenIcon className="w-4 h-4" />
                                                    }
                                                </Button>
                                            </span>
                                        </div>
                                        <FormDescription>
                                            Debe tener almenos 8 caracteres de largo, una mayúscula, una minúscula y un número.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Repetir contraseña</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input
                                                    placeholder="********"
                                                    type={showPassword ? "text" : "password"}
                                                    autoCapitalize="none"
                                                    autoComplete="password"
                                                    autoCorrect="off"
                                                    {...field} />
                                            </FormControl>
                                            <span>
                                                <Button variant="outline" size="icon" type="button" onClick={() => { setShowPassword(!showPassword) }}>
                                                    {showPassword ?
                                                        <EyeClosedIcon className="w-4 h-4" />
                                                        :
                                                        <EyeOpenIcon className="w-4 h-4" />
                                                    }
                                                </Button>
                                            </span>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="pt-2">
                                <Button type="submit" className="w-full" form="register" disabled={newpass.isPending}>
                                    {newpass.isPending ?
                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                        :
                                        "Cambiar contraseña"
                                    }
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            }
        </div>
    )
}