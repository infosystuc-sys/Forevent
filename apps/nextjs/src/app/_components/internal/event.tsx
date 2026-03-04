"use client"

import type { RouterOutputs } from "@forevent/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { GoogleMap, Libraries, Marker, useLoadScript } from "@react-google-maps/api"
import { Building2, Container, DoorOpen, MapPinned, Mic2, Pizza, SquarePen, Ticket, Warehouse } from "lucide-react"
import { useRouter } from "next/navigation"
import { Fragment, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import Return from "~/app/_components/return"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/app/_components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/ui/avatar"
import { Button } from "~/app/_components/ui/button"
import {
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "~/app/_components/ui/card"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "~/app/_components/ui/dialog"
import { Icons } from "~/app/_components/ui/icons"
import { customdayjs } from "~/lib/constants"
import { api } from "~/trpc/react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"

const mapStyle = [
    {
        elementType: "geometry",
        stylers: [
            {
                color: "#242f3e"
            }
        ]
    },
    {
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#746855"
            }
        ]
    },
    {
        elementType: "labels.text.stroke",
        stylers: [
            {
                color: "#242f3e"
            }
        ]
    },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#d59563"
            }
        ]
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#d59563"
            }
        ]
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [
            {
                color: "#263c3f"
            }
        ]
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#6b9a76"
            }
        ]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [
            {
                color: "#38414e"
            }
        ]
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [
            {
                color: "#212a37"
            }
        ]
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#9ca5b3"
            }
        ]
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [
            {
                color: "#746855"
            }
        ]
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [
            {
                color: "#1f2835"
            }
        ]
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#f3d19c"
            }
        ]
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [
            {
                color: "#2f3948"
            }
        ]
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#d59563"
            }
        ]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [
            {
                color: "#17263c"
            }
        ]
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#515c6d"
            }
        ]
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [
            {
                color: "#17263c"
            }
        ]
    }
]

const libraries: Libraries = ["places"]

const formSchema = z.object({
    name: z.string().min(2, { message: 'Se requiere un título' }),
    about: z.string().min(5, { message: 'Se requiere una descripción' }),
})

export default function ReviewEvent({ guildId, eventId, data }: { eventId: string, guildId: string, data: RouterOutputs['web']['event']['byId'] }) {
    const router = useRouter()
    const utils = api.useUtils()
    const [openDialog, setOpenDialog] = useState<boolean>(false)
    const [openApproveDialog, setOpenApproveDialog] = useState<boolean>(false)
    const [coords, setCoords] = useState<{ lat: number, lng: number }>({ lat: data.location.latitude, lng: data.location.longitude })
    const mapRef = useRef<GoogleMap>(null)

    const getEvent = api.web.event.byId.useQuery({ id: eventId }, {
        initialData: data,
    })

    const modify = api.web.internal.modifyEvent.useMutation({
        onSuccess: async (res) => {
            await  utils.web.internal.allGuilds.invalidate()
            toast("Exito", {
                description: `Evento ${res.status === "ACCEPTED" ? 'aceptado' : 'rechazado'} exitosamente`,
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

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            about: "",
        }
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        console.log("submit", values)
        modify.mutate({ id: eventId, status: 'REJECTED', ...values })
    }

    return (
        <div className="flex flex-1 items-center justify-center mb-40">
            <div className="max-w-7xl w-full">
                <Return />
                <div className="flex flex-1 justify-between items-start">
                    <CardHeader className="pt-2">
                        <CardTitle>Solicitud para crear un evento</CardTitle>
                        <CardDescription>
                            Revisa deteniadamente la solicitud de evento.
                        </CardDescription>
                    </CardHeader>
                    <div className='flex gap-5'>
                        <AlertDialog open={openDialog}>
                            <AlertDialogTrigger className="flex gap-4">
                                <Button type='button' variant={"destructive"} onClick={() => {
                                    setOpenDialog(true)
                                }}>
                                    Rechazar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2" >
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Rechazar evento</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                ¿Estás seguro que deseas rechazar el evento? Describe el motivo
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Título</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Debes modificar el..." {...field} />
                                                    </FormControl>
                                                    <FormDescription>Titulo de la devolución</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="about"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Descripción</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            className="resize-none"
                                                            placeholder="El producto del deposito..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Descripción de la devolución</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={modify.isPending} onClick={() => { setOpenDialog(false) }}>Cerrar</AlertDialogCancel>
                                            <AlertDialogAction disabled={modify.isPending} type="submit">Rechazar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </form>
                                </Form>
                            </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog open={openApproveDialog}>
                            <AlertDialogTrigger className="flex gap-4">
                                <Button type='button' className='bg-white text-black hover:bg-white/90' onClick={() => {
                                    setOpenApproveDialog(true)
                                }}>
                                    Aprobar evento
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Aprobar evento</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        ¿Estás seguro que deseas aprobar el evento?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={modify.isPending} onClick={() => { setOpenApproveDialog(false) }}>Cerrar</AlertDialogCancel>
                                    <AlertDialogAction disabled={modify.isPending} className="bg-white text-black hover:bg-white/90" onClick={() => { modify.mutate({ id: eventId, status: 'ACCEPTED' }) }}>Aprobar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </div>
                </div>
                <div className="w-full">
                    <CardHeader className="">
                        <div className="flex gap-4">
                            <Building2 className="h-6 w-6" />
                            <CardTitle>
                                Organización
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className={`flex w-full gap-4 items-center`}>
                        <Avatar className="h-20 w-20">
                            <AvatarImage style={{ objectFit: "cover" }} src={getEvent.data.guild.image ?? ""} alt="profile-image" />
                            <AvatarFallback>
                                <Icons.spinner className=" h-5 w-5 animate-spin" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex justify-between gap-2 w-full">
                            <div>
                                <h4 className="font-bold">Nombre</h4>
                                <p>{getEvent.data.guild.name}</p>
                            </div>
                            <div>
                                <h4 className="font-bold">País</h4>
                                <p>{getEvent.data.guild.country}</p>
                            </div>
                            <div>
                                <h4 className="font-bold">Provincia</h4>
                                <p>{getEvent.data.guild.state}</p>
                            </div>
                            <div>
                                <h4 className="font-bold">Ciudad</h4>
                                <p>{getEvent.data.guild.city}</p>
                            </div>
                            <div>
                                <h4 className="font-bold">Dirección</h4>
                                <p>{getEvent.data.guild.address}</p>
                            </div>
                            <div>
                                <h4 className="font-bold">Creada el</h4>
                                <p>{customdayjs(getEvent.data.startsAt).format("DD/MM/YYYY")}</p>
                            </div>
                        </div>
                    </CardContent>
                </div>
                <div className="flex flex-1 justify-between items-start">

                    <div className="w-full gap-10">
                        <div className="w-full">
                            <CardHeader className="">
                                <div className="flex gap-4">
                                    <SquarePen className="h-6 w-6" />
                                    <CardTitle>
                                        Detalles del evento
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className={`flex w-full gap-4 items-center`}>
                                <Avatar className="h-40 w-40">
                                    <AvatarImage style={{ objectFit: "cover" }} src={getEvent.data.image ?? ""} alt="profile-image" />
                                    <AvatarFallback>
                                        <Icons.spinner className=" h-5 w-5 animate-spin" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-2 w-full">
                                    <div>
                                        <h4 className="font-bold">Nombre</h4>
                                        <p>{getEvent.data.name}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Descripción</h4>
                                        <p>{getEvent.data.about}</p>
                                    </div>
                                    <div className="flex justify-start gap-10">
                                        <div>
                                            <h4 className="font-bold">Desde</h4>
                                            <p>{customdayjs(getEvent.data.startsAt).format("DD/MM/YYYY HH:mm")}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold">Hasta</h4>
                                            <p>{customdayjs(getEvent.data.endsAt).format("DD/MM/YYYY HH:mm")}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </div>
                        <div className="w-full">
                            <CardHeader>
                                <div className="flex gap-4">
                                    <Mic2 className="h-6 w-6" />
                                    <CardTitle>
                                        Artistas creados
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {getEvent.data.artists.length > 0 ?
                                    <>
                                        {getEvent.data.artists.map((artist, index) => {
                                            return (
                                                <div className="pb-4" key={index.toString()}>
                                                    <div className='flex flex-1 justify-between items-center gap-2'>
                                                        <div className='flex space-x-4 items-center'>
                                                            <Avatar className="h-16 w-16">
                                                                <AvatarImage src={artist.image} alt="foto" />
                                                                <AvatarFallback>FT</AvatarFallback>
                                                            </Avatar>
                                                            <h1 className="font-bold">{artist.name}</h1>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </>
                                    :
                                    <div className='flex justify-center items-center'>
                                        <p>No hay artistas</p>
                                    </div>

                                }
                            </CardContent>
                        </div>
                        <div className="w-full">
                            <CardHeader>
                                <div className="flex gap-4">
                                    <Pizza className="h-6 w-6" />
                                    <CardTitle>Productos creados</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {getEvent.data.products.length > 0 ?
                                    <>
                                        {getEvent.data.products.map((product, index) => {
                                            return (
                                                <div className="pb-4" key={index.toString()}>
                                                    <div className='flex flex-1 justify-between items-center gap-2'>
                                                        <div className='flex space-x-4 items-center'>
                                                            <Avatar className="h-16 w-16">
                                                                <AvatarImage src={product.image ?? ""} alt="@shadcn" />
                                                                <AvatarFallback>AR</AvatarFallback>
                                                            </Avatar>
                                                            <div className='space-y-1'>
                                                                <h1 className="font-bold"><h1>{product.name} {product.type === 'FOOD' ? '(COMIDA)' : product.type === 'DRINK' ? '(BEBIDA)' : '(CONSUMIBLE)'}</h1></h1>
                                                                <p>
                                                                    {product.about}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className='flex flex-1 gap-1 items-center justify-end'>
                                                            <p>${product?.price?.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </>
                                    :
                                    <div className='flex justify-center items-center'>
                                        <p>No hay productos</p>
                                    </div>
                                }
                            </CardContent>
                        </div>
                        <div className="w-full">
                            <CardHeader>
                                <div className="flex gap-4">
                                    <Ticket className="h-6 w-6" />
                                    <CardTitle>
                                        Tickets creados
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {getEvent.data.tickets.length > 0 ?
                                    <>
                                        {getEvent.data.tickets.map((ticket, index) => {
                                            return (
                                                <div className="pb-4" key={index.toString()}>
                                                    <div className='flex flex-1 justify-between items-center gap-2'>
                                                        <div className='space-y-1'>
                                                            <h1 className="font-bold">{ticket.name}</h1>
                                                            <p>
                                                                {ticket.about}
                                                            </p>
                                                        </div>
                                                        <div className='flex flex-1 gap-1 items-center justify-end'>
                                                            <p className="font-semibold">${ticket.price.toLocaleString().trim()}</p>
                                                            <p>x</p>
                                                            <p>{ticket.quantity.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </>
                                    :
                                    <div className='flex justify-center items-center'>
                                        <p>No hay tickets</p>
                                    </div>

                                }
                            </CardContent>
                        </div>
                        <div className="w-full">
                            <CardHeader>
                                <div className="flex gap-4">
                                    <Warehouse className="h-6 w-6" />
                                    <CardTitle>Depositos creados</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {getEvent.data.deposits.length > 0 ?
                                    <>
                                        {getEvent.data.deposits.map((deposit, index) => {
                                            return (
                                                <Fragment key={index.toString()}>
                                                    <div className='flex justify-between items-center'>
                                                        <div className='space-y-1'>
                                                            <h1 className="font-semibold">{deposit.name}</h1>
                                                            <p>
                                                                {deposit.about}
                                                            </p>
                                                        </div>
                                                        <div className='flex space-x-2 items-center'>
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="outline">Productos {`(${deposit.productsOnDeposit.length})`}</Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[425px]">
                                                                    <DialogHeader>
                                                                        <DialogTitle>{deposit.name}</DialogTitle>
                                                                        <DialogDescription>
                                                                            Estos son los productos de {deposit.name}
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    {deposit.productsOnDeposit.map((productOnDeposit, pOnDepIndex) => {
                                                                        return (
                                                                            <div className="pb-4" key={index.toString()}>
                                                                                <div className='flex flex-1 justify-between items-center gap-2'>
                                                                                    <div className='space-y-1'>
                                                                                        <h1 className="font-bold">{productOnDeposit.product.name}</h1>
                                                                                    </div>
                                                                                    <div className='flex flex-1 gap-1 items-center justify-end'>
                                                                                        <p>{productOnDeposit.quantity}</p>
                                                                                        <p>ud</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                    <DialogFooter>
                                                                        <DialogClose>
                                                                            <Button type="button">Cerrar</Button>
                                                                        </DialogClose>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    </div>
                                                </Fragment>
                                            )
                                        })}
                                    </>
                                    :
                                    <div className='flex justify-center items-center'>
                                        <p>No hay depositos</p>
                                    </div>

                                }
                            </CardContent>
                        </div>
                    </div>
                    <div className=" w-full">

                        <div className="w-full">
                            {!isLoaded ?
                                <div className="flex flex-1 items-center justify-center">
                                    <Icons.spinner className="mr-2 h-10 w-10 animate-spin" />
                                </div>
                                :
                                <>
                                    <CardHeader className="">
                                        <div className="flex gap-4">
                                            <MapPinned className="h-6 w-6" />
                                            <CardTitle>
                                                Ubicación
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className={`flex w-full flex-col space-y-6`}>
                                        <CardContent className={`flex w-full gap-4 items-center`}>
                                            <Avatar className="h-40 w-40">
                                                <AvatarImage style={{ objectFit: "cover" }} src={getEvent.data.location.image ?? ""} alt="profile-image" />
                                                <AvatarFallback>
                                                    <Icons.spinner className=" h-5 w-5 animate-spin" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col gap-2 w-full">
                                                <div>
                                                    <h4 className="font-bold">Nombre</h4>
                                                    <p>{getEvent.data.location.name}</p>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold">Dirección</h4>
                                                    <p>{getEvent.data.location.address}</p>
                                                </div>
                                                <div className="w-full flex justify-start gap-10">
                                                    <div>
                                                        <h4 className="font-bold">País</h4>
                                                        <p>{getEvent.data.location.country}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold">Provincia</h4>
                                                        <p>{getEvent.data.location.state}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold">Ciudad</h4>
                                                        <p>{getEvent.data.location.city}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <div className="w-full h-72">
                                            <GoogleMap
                                                options={{ backgroundColor: "#222", fullscreenControl: false, streetViewControl: false, mapTypeControl: false, styles: mapStyle, center: coords }}
                                                onClick={(e: any) => {
                                                    console.log(JSON.stringify(e.latLng))
                                                    setCoords(e.latLng)
                                                }}
                                                zoom={15}
                                                // on={() => { console.log("center changed") }}
                                                center={coords}
                                                ref={mapRef}
                                                mapContainerClassName="w-full h-full">
                                                <Marker position={{
                                                    lat: getEvent.data.location.latitude,
                                                    lng: getEvent.data.location.longitude,
                                                }} />
                                            </GoogleMap>
                                        </div>
                                    </CardContent>
                                </>
                            }
                        </div>
                        <div className="w-full">
                            <CardHeader>
                                <div className="flex gap-4">
                                    <DoorOpen className="h-6 w-6" />
                                    <CardTitle>
                                        Puertas creadas
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {getEvent.data.gates.length > 0 ?
                                    <>
                                        {getEvent.data.gates.map((gate, index) => {
                                            return (
                                                <div className="pb-4" key={index.toString()}>
                                                    <div className='flex flex-1 justify-between items-center gap-2'>
                                                        <div className='space-y-1'>
                                                            <h1 className="font-bold">{gate.name}</h1>
                                                            <p>{gate.about}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </>
                                    :
                                    <div className='flex flex-1 justify-center items-center'>
                                        <p>No hay puertas creadas</p>
                                    </div>
                                }
                            </CardContent>
                        </div>
                        <div className="w-full">
                            <CardHeader>
                                <div className="flex gap-4">
                                    <Container className="h-6 w-6" />
                                    <CardTitle>
                                        Mostradores creados
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {getEvent.data.counters.length > 0 ?
                                    <div>
                                        {getEvent.data.counters.map((counter, counterIndex) =>
                                            <Fragment key={counterIndex} >
                                                <div className="pb-4" key={counterIndex.toString()}>
                                                    <div className='flex flex-1 justify-between items-center gap-2'>
                                                        <div className='space-y-1'>
                                                            <h1 className="font-bold">{counter.name}</h1>
                                                            <p>{counter.about}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Fragment>
                                        )}
                                    </div>
                                    :
                                    <div className='flex justify-center items-center'>
                                        <p>No hay mostradores</p>
                                    </div>

                                }
                            </CardContent>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    )
}