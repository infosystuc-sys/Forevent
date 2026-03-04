"use client"

import type { RouterOutputs } from "@forevent/api";
import type { Session } from '@forevent/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from "~/trpc/react";
import { Button } from '../ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Icons } from '../ui/icons';
import { Input } from '../ui/input';

const verifySchema = z.object({ code: z.string().min(1, { message: "Debes completar este campo.", }), validationId: z.string() })


export default function VerifyForm({ session, isVerified }: { session: Session | null, isVerified: Awaited<Awaited<RouterOutputs["web"]["auth"]["getIsVerified"]>> }) {
    const router = useRouter();
    const utils = api.useUtils()
    const effectRan = useRef(false);

    const getIsVerified = api.web.auth.getIsVerified.useQuery({
        email: session?.user?.email!,
        type: "USER"
    }, { initialData: isVerified })

    const form = useForm<z.infer<typeof verifySchema>>({
        resolver: zodResolver(verifySchema),
        defaultValues: {
            code: '',
        }
    })

    const confirmEmail = api.web.auth.submitValidation.useMutation({
        onSuccess: async (res) => {
            console.log(res, "success");

            toast("Confirmación exitosa", {
                description: "Confirmaste el correo electronico exitosamente.",
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
            if (error.data?.code === "UNAUTHORIZED") {
                form.setError("code", { message: error.message })
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

    const createValidation = api.web.auth.createValidation.useMutation({
        onSuccess: (res) => {
            console.log(res, "success created validation")
            form.setValue("validationId", res)
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape, "error")
            if (error.data?.code === "CONFLICT") {
                router.push("/v1")
            } else if (error.data?.code === "BAD_REQUEST") {
                // router.refresh()
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

    async function onSubmitValidation(data: z.infer<typeof verifySchema>) {
        console.log(JSON.stringify(data), "data submit validation")
        console.log(createValidation.data, "HAY create validation data")
        confirmEmail.mutate({ ...data, type: "USER" })

    }

    async function onResend() {
        createValidation.mutate({ email: session?.user.email! as string, type: "USER" })
    }

    useEffect(() => {
        if (!effectRan.current) {
            createValidation.mutate({ email: session?.user.email! as string, type: "USER" })
            if (getIsVerified.data.emailVerified) {
                router.push("/v1")
            }
            console.log("effect applied - only on the FIRST mount");
        }

        return () => { effectRan.current = true };
    }, []);

    return (
        <div className='flex flex-1 items-center justify-center'>
            <div className={"max-w-xl space-y-5"}>
                <div className='flex items-center justify-between'>
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Confirma tu correo electronico
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Ingresa el codigo que te enviamos a tu correo electronico.
                        </p>
                    </div>
                </div>
                <Form {...form}>
                    <form id="verify" onSubmit={form.handleSubmit(onSubmitValidation)} className="w-full space-y-6">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Código de verificación</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: 10234" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Revisa tu bandeja de entrada
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-center items-center">
                            <Button type="submit" className="" form="verify" disabled={confirmEmail.isPending}>
                                {confirmEmail.isPending ?
                                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                    :
                                    "Confirmar"
                                }
                            </Button>
                        </div>
                    </form>
                </Form>
                <div className='flex items-center justify-center'>
                    <p className='text-neutral-400 text-sm'>No te llego el codigo?</p>
                    <Button variant={"link"} onClick={() => { onResend() }}>
                        Enviar otro código
                    </Button>
                </div>
            </div>
        </div>
    )
}
