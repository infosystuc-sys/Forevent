"use client"
import * as z from "zod"

import { Session } from "@forevent/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { signIn } from "next-auth/react"
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
import { handleSignIn } from "./auth-action"

const loginForm = z.object({
    email: z.string().min(2, {
        message: "Debes ingresar un correo electrónico",
    }).email({ message: "Debes ingresar un correo electrónico válido" }).toLowerCase(),
    password: z.string({ required_error: "Debes ingresar una contraseña" }).min(8, {
        message: "No cumple con los requisitos",
    }),
})

export type LoginFormFields = z.infer<typeof loginForm>;

export function LoginForm({ session }: { session: Session | null }) {

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
        await handleSignIn(data).then((response) => {
            console.log(response, "LOGIN PAGE")
            router.push("/v1")
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
            router.push("/v1")
        }
    }, [session])


    return (
        <div className={"w-full space-y-5"}>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Iniciar sesión
                </h1>
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
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                </div>
            </div>

            <Button
                type="button"
                className="w-full"
                variant={"outline"}
                onClick={() => signIn("google", { callbackUrl: "/v1" })}
            >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
            </Button>

            <Button className="w-full" variant={"outline"} asChild>
                <Link href="/register">Crear una cuenta</Link>
            </Button>
            <Button className="w-full" variant={"link"} asChild>
                <Link href="/restore">Olvidé mi contraseña</Link>
            </Button>
        </div>
    )
}