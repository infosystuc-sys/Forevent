"use client"
import * as z from "zod"

import { Session } from "@forevent/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm, useFormState } from "react-hook-form"
import { Button } from "~/app/_components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "~/app/_components/ui/form"
import { Icons } from "~/app/_components/ui/icons"
import { Input } from "~/app/_components/ui/input"
import { handleInternalSignIn } from "./auth-action"

const loginForm = z.object({
    email: z.string().min(2, {
        message: "Debes ingresar un correo electrónico",
    }).email({ message: "Debes ingresar un correo electrónico válido" }).toLowerCase(),
    password: z.string({ required_error: "Debes ingresar una contraseña" }).min(8, {
        message: "No cumple con los requisitos",
    }),
})

export type LoginFormFields = z.infer<typeof loginForm>;

export function InternalLoginForm({ session }: { session: Session | null }) {

    const router = useRouter();
    const [showPassword, setShowPassword] = useState<boolean>(false)

    const form = useForm<z.infer<typeof loginForm>>({
        resolver: zodResolver(loginForm),
        defaultValues: {
            email: '',
            password: ''
        }
    })

    const status = useFormState({ control: form.control })

    async function onSubmit(data: z.infer<typeof loginForm>) {
        await handleInternalSignIn(data).then((response) => {
            console.log(response, "LOGIN PAGE")
            router.push("/internal/v1")
        }).catch((error) => {
            form.setError("email", { message: "Email o contraseña incorrecta" })
            console.log(JSON.stringify(error), "error then", error)
        })

        return new Promise((resolve) => {
            setTimeout(() => resolve({}), 1000);
        });

    }

    useEffect(() => {
        if (session?.user) {
            console.log("authenticated!")
            router.push("internal/v1")
        }
    }, [session])


    return (
        <div className={"w-full space-y-5"}>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Herramientas internas
                </h1>
                <h2 className="text-2xl font-semibold tracking-tight">
                    Iniciar sesión
                </h2>
                <p className="text-sm text-muted-foreground">
                    Ingresa tu correo electrónico para iniciar sesión
                </p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
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
                            <FormItem className="">
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
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={status.isSubmitting || !!session?.user}>
                        {status.isSubmitting || !!session?.user ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : "Iniciar sesión"}
                    </Button>
                </form>
            </Form>
            {/* <Button className="w-full" variant={"outline"}>
                <Link className="" href="/register">
                    Crear una cuenta
                </Link>
            </Button>
            <Button className="w-full" variant={"link"}>
                <Link className="" href="/restore">
                    Olvidé mi contraseña
                </Link>
            </Button> */}
        </div>
    )
}