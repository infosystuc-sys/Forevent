'use client'
import type { ArrayElement, RouterOutputs } from '@forevent/api'
import { Button } from '@forevent/ui/button'
import { zodResolver } from '@hookform/resolvers/zod'
import { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { api } from '~/trpc/react'
import Return from '../../return'
import { DataTablePagination } from '../../table/pagination'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card'
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from '../../ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form'
import { Icons } from '../../ui/icons'
import { Input } from '../../ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { Textarea } from '../../ui/textarea'
import { Toggle } from '../../ui/toggle'

const columns: ColumnDef<ArrayElement<Awaited<RouterOutputs["web"]["event"]["products"]>>>[] = [
    {
        accessorKey: "id",
        header: "",
        cell: () => <></>
    },
    {
        accessorKey: "image",
        header: "",
        cell: ({ row }) => {
            return (
                <div className="w-min">
                    <Avatar className="h-14 w-14">
                        <AvatarImage
                            src={row.original.image ?? ""}
                            alt={"image"}
                        />
                        <AvatarFallback className="text-lg bg-neutral-900">{row.original.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>
            )
        },
    },
    {
        id: "name",
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => {
            return (
                <p>{row.original.name}</p>
            )
        }
    },
    {
        accessorKey: "price",
        header: "Precio",
        cell: ({ row }) => {
            return (
                <p>${row.original.price?.toLocaleString()}</p>
            )
        }
    },
    {
        accessorKey: "about",
        header: "Descripción",
        cell: ({ row }) => {
            return (
                <p>{row.original.about}</p>
            )
        }
    },
    {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => {
            return (
                <p>{row.original.type === 'FOOD' ? 'COMIDA' : row.original.type === 'DRINK' ? 'BEBIDA' : 'CONSUMIBLE'}</p>
            )
        }
    },
    // {
    //     id: "actions",
    //     header: "Ver más",
    //     cell: ({ row }) => {
    //         return (
    //             <Actions original={row.original} />
    //         )
    //     },
    // },
]

const dealSchema = z.object({
    name: z.string().min(2, { message: "Este campo es requerido" }),
    image: z.string().url().min(2, { message: "Este campo es requerido" }),
    about: z.string().optional(),
    price: z.coerce.number().min(0, { message: "Este campo es requerido" }),
    productsOnDeal: z.array(z.object({
        product: z.object({
            productId: z.string().min(2, { message: "Este campo es requerido" }),
            name: z.string().min(2, { message: "Este campo es requerido" }),
        }),
        quantity: z.coerce.number().min(0, { message: "Este campo es requerido" }),
    }))
})

const productSchema = z.object({
    product: z.object({
        productId: z.string().min(2, { message: "Este campo es requerido" }),
        name: z.string().min(2, { message: "Este campo es requerido" }),
    }),
    quantity: z.coerce.number().min(0, { message: "Este campo es requerido" }),
})

function CreateDeal({ initialProducts, eventId }: { initialProducts: Awaited<RouterOutputs["web"]["event"]["products"]>, eventId: string }) {
    const [open, setOpen] = useState(false)
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([])
    const utils = api.useUtils()
    const router = useRouter()

    const products = api.web.event.products.useQuery({
        eventId: eventId!
    }, {
        initialData: initialProducts,
    })

    const create = api.web.deal.create.useMutation({
        onSuccess: async () => {
            await utils.web.event.deals.invalidate()
            await utils.web.cashier.all.invalidate()
            toast("Exito", {
                description: "Promoción creada exitosamente",
                action: {
                    label: "Cerrar", onClick: () => {
                        // console.log("close!")
                    }
                }
            })
            router.back()
        },
        onError: (error) => {
            toast("Error", {
                description: error.message,
                action: {
                    label: "Cerrar", onClick: () => {
                        // console.log("close!")
                    }
                }
            })
        }
    })

    const productTable = useReactTable({
        data: products.data,
        columns: columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    const dealForm = useForm<z.infer<typeof dealSchema>>({
        resolver: zodResolver(dealSchema),
        defaultValues: {
            name: "",
            about: "",
            image: "",
            price: 0,
            productsOnDeal: []
        },
        mode: "onChange"
    })

    const onSubmitDeal = async (values: z.infer<typeof dealSchema>) => {
        console.log(values, "VALUES DEL FORM!")
        if (values.price <= 0) {
            dealForm.setError('price', { message: 'Número no válido' })
        } else {
            create.mutate({
                ...values,
                eventId
            })
        }


    }

    const productForm = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            product: {},
            quantity: 0
        },
        mode: "onChange"
    })

    const onSubmitProduct = async (values: z.infer<typeof productSchema>) => {
        console.log(values, "VALUES DEL FORM!")
        if (values.quantity < 1) {
            productForm.setError('quantity', { message: 'Número no válido' })
            return
        }
        if (dealForm.watch('productsOnDeal')?.some((deposit) => deposit.product.productId === values.product.productId)) {
            productForm.setError('product', { message: 'Ya agregaste este producto' })
        } else {
            let a = dealForm.watch('productsOnDeal') ?? []
            dealForm.setValue('productsOnDeal', [...a, values])
            productForm.reset()
            productTable.resetRowSelection()
            setOpen(false)
        }
    }

    return (
        <div>
            <Return />
            <div className='w-full flex space-x-5 px-5'>
                <Card className="w-full">
                    <CardHeader className="mb-0 pb-2">
                        <CardTitle>
                            Crear promoción
                        </CardTitle>
                        <CardDescription className="max-w-3xl">
                            Promociones del evento
                        </CardDescription>
                    </CardHeader>
                    <Form {...dealForm}>
                        <form onSubmit={dealForm.handleSubmit(onSubmitDeal)} className="flex w-full flex-col space-y-2">
                            <CardContent className={`flex w-full flex-col space-y-2`}>
                                <div className="flex w-full gap-5">
                                    <FormField
                                        control={dealForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Nombre*</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: Vox Night Club" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Nombre visible al público.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={dealForm.control}
                                        name="image"
                                        render={({ field }) => (
                                            <FormItem  {...field} className="w-full">
                                                <FormLabel>Foto*</FormLabel>
                                                <FormControl className="">
                                                    <div className="flex items-center justify-center">
                                                        {dealForm.watch("image") ?
                                                            <div className="flex w-full items-start justify-start space-y-4 gap-5">
                                                                <Avatar className="h-20 w-20">
                                                                    <AvatarImage style={{ objectFit: "cover" }} src={dealForm.watch("image") ?? ""} alt="profile-image" />
                                                                    <AvatarFallback>
                                                                        <Icons.spinner className=" h-5 w-5 animate-spin" />
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <Button type="button" variant={"outline"} onClick={() => {
                                                                    dealForm.setValue("image", "")
                                                                }}>
                                                                    Cambiar imagen
                                                                </Button>
                                                            </div>
                                                            :
                                                            <Input
                                                                id="image"
                                                                type="file"
                                                                accept=".jpg, .jpeg"
                                                                onChange={async (e) => {
                                                                    console.log(e.target.files, "EVENT")
                                                                    if (e.target.files && e.target.files[0]) {
                                                                        const file = e.target.files[0]

                                                                        const response = await fetch(
                                                                            process.env.NEXT_PUBLIC_BASE_URL + '/api/upload',
                                                                            {
                                                                                method: 'POST',
                                                                                headers: {
                                                                                    'Content-Type': 'application/json',
                                                                                },
                                                                                body: JSON.stringify({ filename: file.name, contentType: file.type }),
                                                                            }
                                                                        )

                                                                        if (response.ok) {
                                                                            const { url, fields } = await response.json()

                                                                            console.log(url, "url", fields, "fields")

                                                                            const formData = new FormData()
                                                                            Object.entries(fields).forEach(([key, value]) => {
                                                                                formData.append(key, value! as any)
                                                                            })
                                                                            formData.append('file', file)

                                                                            const uploadResponse = await fetch(url, {
                                                                                method: 'POST',
                                                                                body: formData,
                                                                            })

                                                                            if (uploadResponse.ok) {
                                                                                dealForm.setValue("image", "https://d2l7xb0l2x2ws7.cloudfront.net/" + fields.key)
                                                                                console.log("https://d2l7xb0l2x2ws7.cloudfront.net/" + fields.key, "   URL DEL ARCHIVO")
                                                                                // alert('Upload successful!')
                                                                            } else {
                                                                                console.error('S3 Upload Error:', uploadResponse)
                                                                                // alert('Upload failed.')
                                                                            }
                                                                        } else {
                                                                            alert('Failed to get pre-signed URL.')
                                                                        }
                                                                    }
                                                                }
                                                                }
                                                            />
                                                        }
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    Solo se permiten archivos .jpg y .jpeg de hasta 3MB.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className='flex gap-5'>
                                    <FormField
                                        control={dealForm.control}
                                        name="about"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Descripción</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        className="resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className='flex gap-5'>
                                    <FormField
                                        control={dealForm.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Precio*</FormLabel>
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
                                <Button disabled={dealForm.watch('productsOnDeal').length === 0 || create.isPending} variant={"outline"} type="submit">

                                    {create.isPending ?
                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                        :
                                        "Crear promoción"
                                    }
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
                <Card className="w-full">
                    <CardHeader className="mb-0 pb-2">
                        <CardTitle>
                            Productos agregados
                        </CardTitle>
                        <CardDescription className="max-w-3xl">
                            Productos de la promoción
                        </CardDescription>
                    </CardHeader>
                    <CardContent className={`flex w-full flex-col space-y-2`}>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">Agregar producto</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-screen-md">
                                <Form {...productForm}>
                                    <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="flex w-full flex-col space-y-2">
                                        <FormField
                                            control={productForm.control}
                                            name="product"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel>Producto*</FormLabel>
                                                    <FormControl>
                                                        <div className={`w-full space-y-5`}>
                                                            <div className='flex items-center gap-5'>
                                                                {/* 
                                                         <DataTableToolbar table={employeeTable} />
                                                         */}
                                                            </div>
                                                            <Card className="bg-background">
                                                                <CardContent className='space-y-5 p-0 w-full'>
                                                                    <Table className='w-full'>
                                                                        <TableHeader className='w-full'>
                                                                            {productTable.getHeaderGroups().map((headerGroup) => (
                                                                                <TableRow className='w-full' key={headerGroup.id}>
                                                                                    {headerGroup.headers.map((header) => {
                                                                                        return (
                                                                                            <TableHead key={header.id}>
                                                                                                {header.isPlaceholder
                                                                                                    ? null
                                                                                                    : flexRender(
                                                                                                        header.column.columnDef.header,
                                                                                                        header.getContext()
                                                                                                    )}
                                                                                            </TableHead>
                                                                                        )
                                                                                    })}
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableHeader>
                                                                        <TableBody className='w-full'>
                                                                            {productTable.getRowModel().rows?.length ? (
                                                                                productTable.getRowModel().rows.map((row) => (
                                                                                    <TableRow
                                                                                        className={`w-full ${row.getIsSelected() ? "bg-zinc-800" : ""}`}
                                                                                        key={row.id}
                                                                                        data-state={row.getIsSelected() && "selected"}
                                                                                        onClick={() => {
                                                                                            const selected = !row.getIsSelected()
                                                                                            productTable.resetRowSelection()
                                                                                            row.toggleSelected(selected)
                                                                                            if (selected) {
                                                                                                field.onChange({
                                                                                                    name: row.original.name,
                                                                                                    productId: row.original.id
                                                                                                })
                                                                                            } else {
                                                                                                productForm.resetField('product')
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        {row.getVisibleCells().map((cell) => (
                                                                                            <TableCell key={cell.id}>
                                                                                                {flexRender(
                                                                                                    cell.column.columnDef.cell,
                                                                                                    cell.getContext()
                                                                                                )}
                                                                                            </TableCell>
                                                                                        ))}
                                                                                    </TableRow>
                                                                                ))
                                                                            ) : (
                                                                                <TableRow>
                                                                                    <TableCell
                                                                                        colSpan={columns.length}
                                                                                        className="h-24 text-center"
                                                                                    >
                                                                                        No se encontraron resultados.
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            )}
                                                                        </TableBody>
                                                                    </Table>
                                                                </CardContent>
                                                            </Card>
                                                            <div className='px-5'>
                                                                <DataTablePagination table={productTable} />
                                                            </div>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className='flex gap-5'>
                                            <FormField
                                                control={productForm.control}
                                                name="quantity"
                                                render={({ field }) => (
                                                    <FormItem className="w-full">
                                                        <FormLabel>Cantidad*</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Ej: 123" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Cantidad del producto que contiene la promoción
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button variant={"outline"} type="submit">
                                                Agregar
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                        <div className='flex-row flex-1 justify-center items-center w-full'>
                            {dealForm.watch('productsOnDeal').length === 0 ?
                                <p>Debes agregar productos</p> :
                                <>
                                    {dealForm.watch('productsOnDeal').map((prod, index) => {
                                        return (
                                            <div className="pb-4" key={index.toString()}>
                                                <div className='flex flex-1 justify-between items-center gap-2'>
                                                    <div className='space-y-1'>
                                                        <h1 className="font-bold">{prod.product.name}</h1>
                                                    </div>
                                                    <div className='flex flex-1 gap-1 items-center justify-end'>
                                                        <p>x</p>
                                                        <p>{prod.quantity}</p>
                                                    </div>
                                                    <Toggle aria-label="Toggle bold">
                                                        <X className="h-5 w-5" color="white" onClick={() => {
                                                            let productsCorrected = dealForm.watch('productsOnDeal')
                                                            productsCorrected = productsCorrected.filter((_, i) => index !== i) ?? []
                                                            dealForm.setValue('productsOnDeal', productsCorrected)
                                                        }} />
                                                    </Toggle>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </>
                            }
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default CreateDeal