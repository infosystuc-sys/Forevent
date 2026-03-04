'use client'

import type { RouterOutputs } from "@forevent/api"
import { PaymentType } from "@forevent/db"
import { zodResolver } from "@hookform/resolvers/zod"
import { Minus, Plus } from 'lucide-react'
import Link from "next/link"
import { useState } from 'react'
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from 'zod'
import Return from "~/app/_components/return"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "~/app/_components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/ui/avatar"
import { Button, buttonVariants } from "~/app/_components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from '~/app/_components/ui/card'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/app/_components/ui/form"
import { Icons } from "~/app/_components/ui/icons"
import { Input } from "~/app/_components/ui/input"
import { Label } from '~/app/_components/ui/label'
import { ScrollArea } from '~/app/_components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/app/_components/ui/select"
import { Separator } from '~/app/_components/ui/separator'
import { Toggle } from "~/app/_components/ui/toggle"
import { api } from "~/trpc/react"

const purchaseSchema = z.object({
    name: z.string(),
    paymentType: z.nativeEnum(PaymentType),
    items: z.array(z.object({
        name: z.string(),
        dealId: z.string().optional(),
        productId: z.string().optional(),
        quantity: z.number().min(1, { message: "Debes agregar almenos un item" }),
        price: z.number()
    }))
})

const itemSchema = z.object({
    name: z.string(),
    dealId: z.string().optional(),
    productId: z.string().optional(),
    quantity: z.number().min(1, { message: "Debes agregar almenos un item" }),
    price: z.number()
})

export default function CashierForm({ data, eventId, guildId, counterId }: { data: RouterOutputs["web"]["cashier"]["all"], eventId: string, guildId: string, counterId: string }) {

    const [open, setOpen] = useState<boolean>(false)
    const [openConfirm, setOpenConfirm] = useState<boolean>(false)
    const utils = api.useUtils()
    const itemForm = useForm<z.infer<typeof itemSchema>>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            dealId: undefined,
            productId: undefined,
            quantity: 1,
            price: 0
        },
        mode: "onChange"
    })

    const getProductsAndDeals = api.web.cashier.all.useQuery({ counterId: '0261337a-4c52-4c3e-8900-44a33245ca76' }, { initialData: data })


    const createPurchaseMutation = api.web.purchase.create.useMutation({
        onSuccess: async () => {
            purchaseForm.reset()
            setOpenConfirm(false)
            await utils.web.cashier.all.invalidate()
            toast("Exito", {
                description: "Pedido creado correctamente",
                action: {
                    label: "Cerrar", onClick: () => {
                        // console.log("close!")
                    }
                }
            })
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape, "error")
            toast("Ocurrio un error", {
                description: error.message,
                action: {
                    label: "Cerrar", onClick: () => {
                        console.log("close!")
                    }
                }
            })
        }
    })

    const purchaseForm = useForm<z.infer<typeof purchaseSchema>>({
        resolver: zodResolver(purchaseSchema),
        defaultValues: {
            paymentType: 'CASH',
            name: "",
            items: []
        }
    })

    const [selectedItem, setSelectedItem] = useState<{
        id: string,
        type: "DEAL" | "PRODUCT"
        name: string,
        about: string | null,
        price: number,
        image: string | null
    } | null>(null)

    // const addItem = () => {
    //     purchaseForm.setValue('items', [...purchaseForm.watch('items'), selectedItem])
    // }

    async function onSubmit(data: z.infer<typeof purchaseSchema>) {
        console.log(data, 'data final')
        createPurchaseMutation.mutate({
            ...data,
            eventId
        })
    }

    async function onSubmitItem(data: z.infer<typeof itemSchema>) {
        setOpen(false)
        console.log(JSON.stringify(data), "item")
        if (purchaseForm.watch("items").some((item) => (item.dealId === selectedItem?.id || item.productId === selectedItem?.id))) {
            console.log("SI pertecence al array", purchaseForm.watch("items"), selectedItem, "item seleccionado")
            let newItems = purchaseForm.watch("items").map((item) => {
                if (item.dealId === selectedItem?.id || item.productId === selectedItem?.id) {
                    return { dealId: item.dealId ?? undefined, productId: item.productId ?? undefined, price: item.price, quantity: itemForm.watch("quantity"), name: item.name }
                } else {
                    return item
                }
            })
            purchaseForm.setValue("items", newItems)
        } else {
            console.log("NO pertecence al array", data, selectedItem, "item seleccionado")
            purchaseForm.setValue("items", [...purchaseForm.watch("items"), data])
        }
        itemForm.reset()
    }

    function getTotal(): number {
        let total: number = 0
        purchaseForm.watch("items").map((item) => {
            // console.log(ticket.price, typeof (ticket.price), parseInt(form.watch(ticket.id)), typeof (parseInt(form.watch(ticket.id))))
            total += item.price * item.quantity
        })
        // console.log(typeof (total), total)
        return total
    }

    return (
        <div className="flex flex-1 items-center justify-center">
            <div className=" flex flex-col flex-1 h-screen">
                <div className="flex flex-col flex-1 justify-start items-start px-20 gap-2">
                    <Return />
                    <CardHeader>
                        <CardTitle className="font-semibold">
                            Caja
                        </CardTitle>
                    </CardHeader>
                    <div className="flex justify-between w-full items-center">
                        <div className="flex flex-col justify-center w-full max-w-sm items-start gap-1.5">
                            <Label htmlFor="search">Buscar</Label>
                            <Input type="text" id="search" className='w-72' placeholder="CocaCola" />
                        </div>
                        <div className='flex items-center justify-end'>
                            <Link className={buttonVariants({ variant: 'default', size: 'lg' })} href={`/v1/${guildId}/events/${eventId}/deals/create`}>
                                Crear una promoción
                            </Link>
                        </div>
                    </div>
                    <ScrollArea className="max-w-7xl w-full h-full pb-0 mb-0">
                        {
                            getProductsAndDeals.data.deals.length > 0 && <>
                                <h3 className="text-lg font-medium">Promociones</h3>
                                <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
                                    {
                                        getProductsAndDeals.data?.deals.map((deal, index) =>
                                            <Card key={index.toString()} onClick={() => {
                                                console.log("deal!", deal)
                                                setOpen(true)
                                                setSelectedItem({
                                                    id: deal.id,
                                                    type: "DEAL",
                                                    about: deal.about,
                                                    image: deal.image,
                                                    name: deal.name,
                                                    price: deal.price
                                                })
                                                itemForm.setValue("dealId", deal.id)
                                                itemForm.setValue("price", deal.price)
                                                itemForm.setValue("name", deal.name)
                                                // itemForm.setValue('quantity', purchaseForm?.watch('items')?.find(item => item?.dealId && (deal?.id === item.dealId)).quantity ?? 1)
                                            }} className={`hover:bg-secondary hover:scale-110 transition-all duration-100 w-full m-3`}>
                                                <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
                                                    <CardTitle className="text-xl font-thin">
                                                        {deal.name}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="w-full flex items-center justify-center">
                                                        <Avatar className="h-20 w-20">
                                                            <AvatarImage
                                                                src={deal.image ?? ""}
                                                                alt={"image"}
                                                            />
                                                            <AvatarFallback className="text-lg bg-neutral-900">{deal.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                    <p className="text-center">
                                                        ${deal.price}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )
                                    }
                                </div>
                            </>
                        }
                        {
                            getProductsAndDeals.data.products.length > 0 && <>
                                <h3 className="text-lg font-medium">Productos</h3>
                                <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
                                    {
                                        getProductsAndDeals.data?.products.map((product, index) =>
                                            <Card key={index.toString()} onClick={() => {
                                                console.log("product", product.product)
                                                setSelectedItem({
                                                    id: product.product.id,
                                                    type: "PRODUCT",
                                                    about: product.product.about,
                                                    image: product.product.image,
                                                    name: product.product.name,
                                                    price: product.product.price
                                                })
                                                setOpen(true)
                                                itemForm.setValue("productId", product.product.id)
                                                itemForm.setValue("name", product.product.name)
                                                itemForm.setValue("price", product.product.price)
                                            }} className={`hover:bg-secondary hover:scale-110 transition-all duration-100 w-full m-3`}>
                                                <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
                                                    <CardTitle className="text-xl font-thin">
                                                        {product.product.name}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="w-full flex items-center justify-center">
                                                        <Avatar className="h-20 w-20">
                                                            <AvatarImage
                                                                src={product.product.image ?? ""}
                                                                alt={"image"}
                                                            />
                                                            <AvatarFallback className="text-lg bg-neutral-900">{product.product.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                    <p className="text-center">
                                                        ${product.product.price}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )
                                    }
                                </div>
                            </>
                        }
                    </ScrollArea>
                    <Form {...itemForm}>
                        <form id="item" onSubmit={itemForm.handleSubmit(onSubmitItem)} className="w-full space-y-4">
                            <AlertDialog open={open}>
                                <AlertDialogContent className="w-max" onKeyDown={(event) => {
                                    if (event.key === '+') {
                                        itemForm.setValue("quantity", itemForm.watch("quantity") + 1)
                                    } else if (event.key === '-') {
                                        if (itemForm.watch("quantity") > 1) {
                                            itemForm.setValue("quantity", itemForm.watch("quantity") + 1)
                                        }
                                    }
                                }}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Agregar {selectedItem?.name} a la compra</AlertDialogTitle>
                                        <FormField
                                            control={itemForm.control}
                                            name="quantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cantidad</FormLabel>
                                                    <div className="flex gap-2 items-center justify-center">
                                                        <Toggle aria-label="Toggle bold">
                                                            <Minus className="h-5 w-5" color="white" onClick={() => {
                                                                if (field.value > 1) {
                                                                    field.onChange(field.value - 1)
                                                                }
                                                            }} />
                                                        </Toggle>
                                                        <FormControl>
                                                            <Input
                                                                type={"number"}
                                                                min={1}
                                                                className="w-min"
                                                                {...field} />
                                                        </FormControl>
                                                        <Toggle aria-label="Toggle bold">
                                                            <Plus className="h-5 w-5" color="white" onClick={() => {
                                                                field.onChange(field.value + 1)
                                                            }} />
                                                        </Toggle>

                                                    </div>
                                                    <FormDescription>

                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => {
                                            setOpen(false)
                                            setSelectedItem(null)
                                            itemForm.reset()
                                        }}>
                                            Cancelar
                                        </AlertDialogCancel>
                                        {/* <AlertDialogAction>Agregar</AlertDialogAction> */}
                                        <Button type="submit" form="item">
                                            Agregar
                                        </Button>
                                    </AlertDialogFooter>
                                </AlertDialogContent>

                            </AlertDialog>
                        </form>
                    </Form>
                </div>
                <div className="sticky bottom-0 w-full bg-neutral-900 border-t pb-0 mb-0">
                    <div className="container flex flex-1 flex-col items-start justify-between lg:flex-row">
                        <ScrollArea className='h-72 p-6 w-full '>
                            <h4 className="text-3xl font-semibold">Detalle</h4>
                            {purchaseForm.watch("items").map((item, index) => {
                                return (
                                    <div key={index.toString()} className="flex flex-col  justify-start items-start">
                                        <h4>{item.name}</h4>
                                        <p>{item.quantity} unidades</p>
                                        <p>$ {item.quantity * item.price} subtotal</p>
                                    </div>
                                )
                            }
                            )}
                        </ScrollArea>
                        <Separator className='w-11/12 lg:hidden' />
                        <Separator orientation='vertical' className='h-3/4 hidden lg:block' />
                        <div className='h-full p-8 flex flex-col justify-between min-w-96 gap-4 items-center'>
                            <h4 className="text-4xl font-semibold">Total</h4>
                            <p className="text- text-5xl font-extrabold">
                                $ {getTotal().toLocaleString() ?? (0).toLocaleString()}
                            </p>
                            <Form {...purchaseForm}>
                                <form id="purchase" onSubmit={purchaseForm.handleSubmit(onSubmit)} className="space-y-8">
                                    <AlertDialog open={openConfirm}>
                                        <AlertDialogTrigger asChild>
                                            <Button size={'lg'} className='text-nowrap w-full' disabled={getTotal() === 0} onClick={() => setOpenConfirm(true)}>
                                                Confirmar compra
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmar Compra</AlertDialogTitle>
                                                <div>
                                                    <FormField
                                                        control={purchaseForm.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Nombre</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Franco" {...field} />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Nombre del comprador
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={purchaseForm.control}
                                                        name="paymentType"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Método de pago</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Efectivo" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="CASH">Efectivo</SelectItem>
                                                                        <SelectItem value="ONLINE">Tarjeta de crédito/débito</SelectItem>
                                                                        <SelectItem value="MERCADOPAGO">Mercado Pago</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormDescription>
                                                                    Selecciona un método de pago
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setOpenConfirm(false)}>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction type="submit" disabled={createPurchaseMutation.isPending} form="purchase">
                                                    {createPurchaseMutation.isPending ?
                                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                                        :
                                                        "Confirmar"
                                                    }
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </form>
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
