'use client'
import { Button } from '@forevent/ui/button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { api } from '~/trpc/react'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form'
import { Icons } from '../../ui/icons'
import { Input } from '../../ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Textarea } from '../../ui/textarea'

const productSchema = z.object({
    name: z.string().min(2, { message: "Este campo es requerido" }),
    type: z.enum(["FOOD", "DRINK", "CONSUMABLE"]),
    image: z.string().url().min(2, { message: "Este campo es requerido" }),
    about: z.string().optional(),
    price: z.coerce.number().min(0, { message: "Este campo es requerido" }),
})

function CreateProduct({ eventId }: { eventId: string }) {
    const utils = api.useUtils()
    const router = useRouter()
    const productForm = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            about: "",
            image: "",
            type: "FOOD",
            price: 0
        },
        mode: "onChange"
    })

    const create = api.web.event.createProduct.useMutation({
        onSuccess: async () => {
            await utils.web.event.products.invalidate()
            toast("Exito", {
                description: "Producto creado exitosamente",
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

    const onSubmitProduct = async (values: z.infer<typeof productSchema>) => {
        console.log(values, "VALUES DEL FORM!")
        create.mutate({
            ...values,
            eventId,
        })
    }

    return (
        <div>
            <Card className="w-full">
                <CardHeader className="mb-0 pb-2">
                    <CardTitle>
                        Productos
                    </CardTitle>
                    <CardDescription className="max-w-3xl">
                        Crea productos para tu evento.
                    </CardDescription>
                </CardHeader>
                <Form {...productForm}>
                    <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="flex w-full flex-col space-y-2">
                        <CardContent className={`flex w-full flex-col space-y-2`}>
                            <div className="flex w-full gap-5">
                                <FormField
                                    control={productForm.control}
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
                                    control={productForm.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem  {...field} className="w-full">
                                            <FormLabel>Foto*</FormLabel>
                                            <FormControl className="">
                                                <div className="flex items-center justify-center">
                                                    {productForm.watch("image") ?
                                                        <div className="flex w-full items-start justify-start space-y-4 gap-5">
                                                            <Avatar className="h-20 w-20">
                                                                <AvatarImage style={{ objectFit: "cover" }} src={productForm.watch("image") ?? ""} alt="profile-image" />
                                                                <AvatarFallback>
                                                                    <Icons.spinner className=" h-5 w-5 animate-spin" />
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <Button type="button" variant={"outline"} onClick={() => {
                                                                productForm.setValue("image", "")
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
                                                                            formData.append(key, value!)
                                                                        })
                                                                        formData.append('file', file)

                                                                        const uploadResponse = await fetch(url, {
                                                                            method: 'POST',
                                                                            body: formData,
                                                                        })

                                                                        if (uploadResponse.ok) {
                                                                            productForm.setValue("image", "https://d2l7xb0l2x2ws7.cloudfront.net/" + fields.key)
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
                                    control={productForm.control}
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
                                    control={productForm.control}
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
                                <FormField
                                    control={productForm.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem {...field} className="w-full">
                                            <FormLabel className="">
                                                Tipo de producto *
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup className="overflow-y-auto max-h-[10rem]">
                                                        <SelectItem value="FOOD">
                                                            Comida
                                                        </SelectItem>
                                                        <SelectItem value="DRINK">
                                                            Bebida
                                                        </SelectItem>
                                                        <SelectItem value="CONSUMABLE">
                                                            Consumible
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            {/* <FormDescription className="w-max">
                                                    Obligatorio.
                                                </FormDescription> */}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex items-center justify-center">
                            <Button variant={"outline"} type="submit">
                                Crear producto
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    )
}

export default CreateProduct