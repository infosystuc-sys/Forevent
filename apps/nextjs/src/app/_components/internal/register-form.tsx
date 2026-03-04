"use client"

import * as React from "react"
import * as z from "zod"

import { zodResolver } from "@hookform/resolvers/zod"
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons"
import Link from "next/link"
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
import { handleInternalSignIn } from "./auth-action"

const FormSchema = z.object({
    email: z.string().min(2, {
        message: "Debes ingresar un correo electrónico",
    }).email({ message: "Debes ingresar un correo electrónico válido" }).toLowerCase(),
    confirmEmail: z.string().min(2, {
        message: "Debes ingresar un correo electrónico",
    }).email({ message: "Debes ingresar un correo electrónico válido" }).toLowerCase(),
    name: z.string().min(2, {
        message: "Debes ingresar tu nombre",
    }),
    password: z.string({ required_error: "Debes ingresar una contraseña" }).min(8, {
        message: "No cumple con los requisitos",
    }),
    confirmPassword: z.string({ required_error: "Debes ingresar una contraseña" }).min(8, {
        message: "No cumple con los requisitos",
    })
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"], // path of error
}).refine((data) => data.email === data.confirmEmail, {
    message: "Los correos no coinciden",
    path: ["confirmEmail"], // path of error
});


export function InternalRegisterForm() {
    const [showPassword, setShowPassword] = React.useState<boolean>(false)
    const router = useRouter();

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: '',
            confirmEmail: '',
            name: '',
            password: '',
            confirmPassword: ''
        }
    })

    const createAccount = api.web.auth.register.useMutation({
        onSuccess: async (res) => {
            console.log(res, "success")
            const login: any = await handleInternalSignIn({ email: form.watch("email"), password: form.watch("password") })
            console.log(login, "LOGIN")
            if (login?.error) {
                console.log(login.error, "ERROR AL SUBMITEAR")
                switch (login.error) {
                    case "WRONG_PASSWORD":
                        form.setError("password", { message: "Contraseña incorrecta" })
                        return
                    default:
                        form.setError("email", { message: "Cuenta inexistente" })
                        return
                }
            }
            router.push("/account/verifyemail")
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape, "error")
            if (error.data?.code === "CONFLICT") {
                form.setError("email", { message: error.message })
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

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        console.log(JSON.stringify(data))
        createAccount.mutate(data)
    }

    return (
        <div>
            <div className={"w-full space-y-5"}>
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Crea una cuenta
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Debes completar todos los campos para crear una cuenta
                    </p>
                </div>
                <Form {...form}>
                    <form id="register" onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombres</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Juan"
                                            type="text"
                                            autoCapitalize="words"
                                            autoCorrect="off"
                                            {...field} />
                                    </FormControl>
                                    {/* <FormDescription>
                                    This is your public display name.
                                </FormDescription> */}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo electrónico</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="nombre@example.com"
                                            type="email"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                            autoCorrect="off"
                                            {...field} />
                                    </FormControl>
                                    {/* <FormDescription>
                                    This is your public display name.
                                </FormDescription> */}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Repetir correo electrónico</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="nombre@example.com"
                                            type="email"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                            autoCorrect="off"
                                            {...field} />
                                    </FormControl>
                                    {/* <FormDescription>
                                    This is your public display name.
                                </FormDescription> */}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                            <Button type="submit" className="w-full" form="register" disabled={createAccount.isPending}>
                                {createAccount.isPending ?
                                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                    :
                                    "Crear cuenta"
                                }
                            </Button>
                        </div>
                    </form>
                </Form>
                <Button className="w-full" variant={"outline"}>
                    <Link className="" href="/login">
                        Volver a iniciar sesión
                    </Link>
                </Button>
            </div>
        </div>
    )
}