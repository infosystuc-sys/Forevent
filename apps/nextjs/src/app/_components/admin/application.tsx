"use client"

import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from "sonner"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/app/_components/ui/dialog"
import { customdayjs } from "~/lib/constants"
import { api } from '~/trpc/react'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Icons } from "../ui/icons"
import { Input } from '../ui/input'

// PENDIENTE AGREGAR PARA QUE PUEDA SELECCIONAR UN ROL

const formSchema = z.object({
    email: z.string({ required_error: "Se requiere un email" }).max(50).toLowerCase(),
    role: z.enum(['EMPLOYEE', 'MANAGER'])
})

function Application(data: { guildId: string }) {
    const [open, setOpen] = useState(false)
    const [openDialog, setOpenDialog] = useState(false)
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            role: 'EMPLOYEE'
        }
    })

    const inviteEmployee = api.web.userOnGuild.createInvite.useMutation({
        onSuccess: (res) => {
            console.log(res, "success")
            form.reset()
            setOpen(false)
            setOpenDialog(false)
            toast("Invitación creada con exito", {
                description: `Creada a las ${customdayjs().format("HH:mm")}`,
                action: {
                    label: "Cerrar",
                    onClick: () => console.log("cerrar"),
                },
            })
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape, "error")
            if (error.data?.code === "NOT_FOUND") {
                form.setError("email", { message: error.message })
            } else {
                toast("Ocurrio un error", {
                    description: `${error.message}`,
                    // action: {
                    //   label: "Cerrar",
                    //   onClick: () => console.log("Undo"),
                    // },
                })
            }
        }
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        console.log("invite submitted!")
        inviteEmployee.mutate({ email: values.email, guildId: data.guildId, role: values.role})
    }

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button>Nuevo empleado</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => router.push('employees/create')}>
                            <Link className='flex' href={'employees/create'}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Crear
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setOpenDialog(true)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Invitar
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={openDialog} onOpenChange={() => {
                form.reset()
                setOpenDialog(!openDialog)
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2" >
                            <DialogHeader className="space-y-2">
                                <DialogTitle>Invitar a un empleado</DialogTitle>
                                <DialogDescription>
                                    Invita a un empleado que ya este registrado en Forevent.
                                </DialogDescription>
                            </DialogHeader>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className='pt-4'>
                                <Button disabled={inviteEmployee.isPending} type="submit">
                                    {inviteEmployee.isPending ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : "Invitar"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default Application