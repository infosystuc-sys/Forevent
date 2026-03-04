"use client"

import type { Session } from '@forevent/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '~/app/_components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '~/app/_components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/app/_components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/app/_components/ui/form'
import { Input } from '~/app/_components/ui/input'
import { api } from '~/trpc/react'
import { Icons } from '../ui/icons'

const formSchema = z.object({
    email: z.string({ required_error: "Se requiere un email" }).max(50).toLowerCase(),
})

export default function CreateOrJoin({ session }: { session: Session | null }) {
    const [openDialog, setOpenDialog] = useState(false)
    const { setTheme, theme } = useTheme()
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: ''
        }
    })

    const createPetition = api.web.userOnGuild.createPetition.useMutation({
        onSuccess: (res) => {
            setOpenDialog(false)
            toast("Solicitud creada con exito", {
                description: `Si la aceptan, te enviaremos un correo y podras ingresar a la organización.`,
                action: {
                    label: "Cerrar",
                    onClick: () => console.log("cerrar"),
                },
            })
            console.log(res, "success")
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape, "error")
            if (error.data?.code === "NOT_FOUND") {
                form.setError("email", { message: error.message })
            }
        }
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        createPetition.mutate({ email: values.email, userId: session?.user.id! })
    }

    return (
        <div className='flex flex-1 py-20 justify-center items-center'>
            <div className='max-w-3xl space-y-5'>
                <CardHeader>
                    <CardTitle>Bienvenido, {session?.user?.name}</CardTitle>
                    <CardDescription>Para continuar debes:</CardDescription>
                </CardHeader>
                <CardContent className='flex justify-center items-center'>
                    <div className='flex flex-col justify-center items-center space-y-5 max-w-xl'>
                        <Button type='button' className='w-full'>
                            <Link href={"/v1/create"}>
                                Crear tu propia organización
                            </Link>
                        </Button>
                        <div className='flex items-center justify-center w-full gap-5'>
                            <div className='border-b  w-full'></div>
                            <p className='w-max'>o</p>
                            <div className='border-b w-full'></div>
                        </div>
                        <Button className='w-full' variant={"outline"} type='button' onClick={() => setOpenDialog(true)}>Solicitar unirte a una organización</Button>
                        <Dialog open={openDialog} onOpenChange={() => {
                            form.reset()
                            setOpenDialog(!openDialog)
                        }}>
                            <DialogContent className="sm:max-w-[425px]">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} >
                                        <DialogHeader>
                                            <DialogTitle>Únete a una organización</DialogTitle>
                                            <DialogDescription>
                                                Ingresa el correo electrónico del dueño de la organización
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
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
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <DialogFooter className='pt-4'>
                                            <Button disabled={createPetition.isPending} type="submit">
                                                {createPetition.isPending ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : "Solicitar"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </div>
        </div>
    )
}