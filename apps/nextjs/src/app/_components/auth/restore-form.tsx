"use client"

import * as React from "react"
import * as z from "zod"

import { Session } from "@forevent/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircledIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, useFormState } from "react-hook-form"
import { toast } from "sonner"
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
import { api } from "~/trpc/react"
import { CardDescription, CardTitle } from "../ui/card"

const FormSchema = z.object({
    email: z.string().email({ message: "Debes ingresar un correo electrónico" }).min(2, {
        message: "Email must be at least 2 characters.",
    }).toLowerCase(),
})

export function RestoreForm({ session }: { session: Session | null }) {
    const router = useRouter();
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: '',
        }
    })
    const status = useFormState({ control: form.control })

    const restore = api.web.auth.restorePassword.useMutation({
        onSuccess: async (res) => {

            console.log(res, "success");
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape, "error")
            if (error.data?.code === "NOT_FOUND") {
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
        console.log(JSON.stringify(data), "DATAZO")
        restore.mutate(data)
        // return new Promise((resolve) => {
        //     setTimeout(() => resolve({}), 1000);
        // });
    }

    React.useEffect(() => {
        return () => {
            if (session?.user) {
                console.log("authenticated!")
                router.push("/v1")
            }
        }
    }, [session])


    return (
        <div className={"w-full space-y-6"}>
            {restore.isSuccess ?
                <div className="flex items-center justify-center gap-4">
                    <CheckCircledIcon className="w-10 h-10" color="green" fontSize={40} />
                    <div className="space-y-2">
                        <CardTitle>
                            Solicitud exitosa
                        </CardTitle>
                        <CardDescription>
                            Si no ves el correo en tu bandeja de entrada, revisa tu carpeta de spam.
                        </CardDescription>
                    </div>
                </div>
                :
                <>
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Restaurar contraseña
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Ingresa el correo electronico con el que te registraste
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
                            <Button type="submit" className="w-full" disabled={restore.isPending}>
                                {restore.isPending ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : "Restaurar"}
                            </Button>
                        </form>
                    </Form>
                    <Button className="w-full" variant={"outline"}>
                        <Link className="" href="/login">
                            Volver
                        </Link>
                    </Button>
                </>
            }
        </div>
    )
}