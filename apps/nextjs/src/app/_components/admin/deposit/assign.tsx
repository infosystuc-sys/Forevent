'use client'
import type { RouterOutputs } from "@forevent/api"
import { Button } from '@forevent/ui/button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { api } from '~/trpc/react'
import Return from '../../return'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form'
import { Icons } from '../../ui/icons'
import { Input } from '../../ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

const formSchema = z.object({
    productId: z.string().min(2, { message: "Este campo es requerido" }),
    quantity: z.coerce.number().min(0, { message: "Este campo es requerido" }),
})

function AssignProductOnDeposit({ inicialProducts, eventId, depositId }: { inicialProducts: RouterOutputs['web']['event']['products'], eventId: string, depositId: string }) {
    const utils = api.useUtils()
    const router = useRouter()

    const products = api.web.event.products.useQuery({ eventId }, {
        initialData: inicialProducts
    })

    const assign = api.web.deposit.assign.useMutation({
        onSuccess: async () => {
            toast("Exito", {
                description: `Producto asignado con exito`,
                action: {
                    label: "Cerrar",
                    onClick: () => console.log("cerrar"),
                },
            })
            await utils.web.event.deposits.invalidate()
            router.back()
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape, "error")
            toast("Ocurrio un error", {
                description: `${error.message}`,
                action: {
                    label: "Cerrar",
                    onClick: () => console.log("cerrar"),
                },
            })
        }
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            productId: '',
            quantity: 0
        },
        mode: "onChange"
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        console.log('formis values', values)
        assign.mutate({ depositId, ...values })
    }
    return (
        <div className='flex flex-1 flex-col'>
            <div className='flex items-start'>
                <Return />
                <Card className="flex-1">
                    <CardHeader className="mb-0 pb-2">
                        <CardTitle>
                            Asignar producto
                        </CardTitle>
                        <CardDescription className="max-w-3xl">
                            Descripción productos en un deposito.
                        </CardDescription>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col space-y-2">
                            <CardContent className="flex flex-1 gap-10">
                                <div className={`flex flex-col w-full gap-2`}>
                                    <FormField
                                        control={form.control}
                                        name="productId"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Producto*</FormLabel>
                                                <FormControl>
                                                    <Select value={field.value} onValueChange={(val) => field.onChange(val)}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Seleccionar" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                {products.data.map((product) => {
                                                                    return <SelectItem value={product.id}>{product.name}</SelectItem>
                                                                })}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormDescription>
                                                    De aquí se sacarán los productos
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Cantidad*</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: Calle 123" {...field} />
                                                </FormControl>
                                                <FormDescription>

                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex items-center justify-center">
                                <Button disabled={assign.isPending} variant={"outline"} type="submit">
                                    {assign.isPending ?
                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                        :
                                        "Agregar"
                                    }
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            </div>
        </div>
    )
}

export default AssignProductOnDeposit