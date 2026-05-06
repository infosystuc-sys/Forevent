"use client"

import type { Session } from '@forevent/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from "~/trpc/react";
import { Button } from '../ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Icons } from '../ui/icons';
import { Input } from '../ui/input';

const verifySchema = z.object({
    code: z.string().min(1, { message: "Debes completar este campo." }),
})

export default function VerifyForm({ session, challengeId }: { session: Session | null, challengeId: string }) {
    const router = useRouter();
    const utils = api.useUtils()
    const [validationId, setValidationId] = useState(challengeId)

    const form = useForm<z.infer<typeof verifySchema>>({
        resolver: zodResolver(verifySchema),
        defaultValues: {
            code: '',
        }
    })

    const confirmEmail = api.web.auth.submitValidation.useMutation({
        onSuccess: async () => {
            toast("Confirmación exitosa", {
                description: "Confirmaste el correo electronico exitosamente.",
                action: { label: "Cerrar", onClick: () => {} },
            })
            await utils.web.guild.getGuilds.invalidate()
            await utils.web.auth.getIsVerified.invalidate()
            router.push("/v1")
        },
        onError: (error) => {
            if (error.data?.code === "UNAUTHORIZED") {
                form.setError("code", { message: error.message })
            } else {
                toast("Ocurrio un error", {
                    description: error.message,
                    action: { label: "Cerrar", onClick: () => {} },
                })
            }
        }
    })

    const createValidation = api.web.auth.createValidation.useMutation({
        onSuccess: (res) => {
            setValidationId(res)
            toast("Código enviado", {
                description: "Revisa tu bandeja de entrada.",
                action: { label: "Cerrar", onClick: () => {} },
            })
        },
        onError: (error) => {
            if (error.data?.code === "CONFLICT") {
                router.push("/v1")
            } else {
                toast("Ocurrio un error al enviar el código", {
                    description: error.message,
                    action: { label: "Cerrar", onClick: () => {} },
                })
            }
        }
    })

    function onSubmitValidation(data: z.infer<typeof verifySchema>) {
        confirmEmail.mutate({ code: data.code, validationId, type: "USER" })
    }

    function onResend() {
        createValidation.mutate({ email: session?.user.email! as string, type: "USER" })
    }

    const isSending = createValidation.isPending
    const isConfirming = confirmEmail.isPending

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
                            <Button type="submit" form="verify" disabled={isConfirming}>
                                {isConfirming ?
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
                    <Button variant={"link"} onClick={onResend} disabled={isSending || isConfirming}>
                        {isSending ?
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            :
                            "Enviar otro código"
                        }
                    </Button>
                </div>
            </div>
        </div>
    )
}
