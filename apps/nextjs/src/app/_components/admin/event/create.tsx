"use client"

import type { ArrayElement, RouterOutputs } from "@forevent/api"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Libraries } from "@react-google-maps/api";
import { GoogleMap, Marker, StandaloneSearchBox, useLoadScript } from "@react-google-maps/api"
import type {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState
} from "@tanstack/react-table";
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable
} from "@tanstack/react-table"
import { Container, DoorOpen, MapPinned, Mic2, Package, Pizza, SquarePen, Ticket, Warehouse, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Fragment, useRef, useState } from "react"
import { CountryDropdown, RegionDropdown } from "react-country-region-selector"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import Return from "~/app/_components/return"
import { DataTableColumnHeader } from '~/app/_components/table/column-header'
import { Button } from "~/app/_components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "~/app/_components/ui/card"
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/app/_components/ui/table"
import { customdayjs } from "~/lib/constants"
import { api } from "~/trpc/react"
import { DataTablePagination } from "../../table/pagination"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "../../ui/dialog"
import { ScrollArea } from "../../ui/scroll-area"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Textarea } from "../../ui/textarea"
import { Toggle } from "../../ui/toggle"
import { Nav } from "./nav"

const employeesColumns: ColumnDef<ArrayElement<RouterOutputs["web"]["userOnGuild"]["getEmployees"]>>[] = [
    {
        accessorKey: "image",
        header: "",
        cell: ({ row }) => {
            return (
                <div className="flex items-center justify-center">
                    <Avatar className="h-6 w-6">
                        <AvatarImage
                            src={row.original.user?.image ?? ""}
                            alt={"image"}
                        />
                        <AvatarFallback className="text-lg">{row.original.user?.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>
            )
        },
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Empleado" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex space-x-2">
                    <span className="max-w-[500px] truncate font-medium">
                        {row.original.user?.name}
                    </span>
                </div>
            )
        },
    },
]

const completeEventSchema = z.object({
    name: z.string().min(2, { message: "Este campo es requerido" }),
    about: z.string().min(2, { message: "Este campo es requerido" }),
    image: z.string().url().min(2, { message: "Este campo es requerido" }),
    startsAt: z.string().min(2, { message: "Este campo es requerido" }),
    endsAt: z.string().min(2, { message: "Este campo es requerido" }),
    private: z.boolean(),
    location: z.object({
        name: z.string().min(2, { message: "Este campo es requerido" }),
        latitude: z.number().min(-90).max(90, { message: "Este campo es requerido" }),
        longitude: z.number().min(-180).max(180, { message: "Este campo es requerido" }),
        iana: z.string().min(2, { message: "Este campo es requerido" }),
        country: z.string().min(2, { message: "Este campo es requerido" }),
        state: z.string().min(2, { message: "Este campo es requerido" }),
        city: z.string().min(2, { message: "Este campo es requerido" }),
        address: z.string().min(2, { message: "Este campo es requerido" }),
        image: z.string().url().min(2, { message: "Este campo es requerido" }),
    }),
    gates: z.array(
        z.object({
            employees: z.array(
                z.string()
            ),
            name: z.string(),
            about: z.string().optional()
        })
    ).min(1, { message: "Este campo es requerido" }),
    tickets: z.array(
        z.object({
            name: z.string(),
            price: z.number(),
            quantity: z.number(),
            about: z.string().optional(),
            validUntil: z.string().optional()
        })
    ).min(1, { message: "Este campo es requerido" }),
    artists: z.array(
        z.object({
            name: z.string(),
            image: z.string().url()
        })
    ).optional(),
    deposits: z.array(
        z.object({
            name: z.string(),
            about: z.string().optional(),
            counters: z.array(
                z.object({
                    employees: z.array(
                        z.string()
                    ),
                    name: z.string(),
                    about: z.string().optional()
                })
            ),
            productsOnDeposit: z.array(
                z.object({
                    name: z.string(),
                    quantity: z.number().int()
                })
            ),
        })
    ).optional(),
    products: z.array(
        z.object({
            name: z.string(),
            type: z.enum(["FOOD", "DRINK", "CONSUMABLE"]),
            image: z.string().url(),
            about: z.string().optional(),
            price: z.number(),
        })
    ).optional(),
})

const searchSchema = z.object({
    search: z.string().optional(),
})

const gateSchema = z.object({
    employees: z.array(
        z.string().min(2, { message: "Este campo es requerido" }),
    ),
    name: z.string().min(2, { message: "Este campo es requerido" }),
    about: z.string().optional()
})

const depositSchema = z.object({
    name: z.string().min(2, { message: "Este campo es requerido" }),
    about: z.string().optional(),
    products: z.array(z.string())
})

const counterSchema = z.object({
    employees: z.array(
        z.string().min(2, { message: "Este campo es requerido" }),
    ),
    deposit: z.string().min(2, { message: "Este campo es requerido" }),
    name: z.string().min(2, { message: "Este campo es requerido" }),
    about: z.string().optional()
})

const ticketSchema = z.object({
    name: z.string().min(2, { message: "Este campo es requerido" }),
    price: z.coerce.number().min(0, { message: "Este campo es requerido" }),
    quantity: z.coerce.number().min(1, { message: "Este campo es requerido" }),
    about: z.string().optional(),
    validUntil: z.string().optional()
})

const productSchema = z.object({
    name: z.string().min(2, { message: "Este campo es requerido" }),
    type: z.enum(["FOOD", "DRINK", "CONSUMABLE"]),
    image: z.string().url().min(2, { message: "Este campo es requerido" }),
    about: z.string().optional(),
    price: z.coerce.number().min(0, { message: "Este campo es requerido" }),
})

const artistSchema = z.object({
    name: z.string().min(2, { message: "Este campo es requerido" }),
    image: z.string().url().min(2, { message: "Este campo es requerido" }),
})

const productOnDepositSchema = z.object({
    productName: z.string().min(2, { message: "Este campo es requerido" }),
    depositName: z.string().min(2, { message: "Este campo es requerido" }),
    quantity: z.coerce.number().int()
})

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

interface LocationSearch {
    street_number?: string,
    route?: string,
    locality?: string,
    state?: string,
    country?: string,
    postal_code?: string,
}

const libraries: Libraries = ["places"]

export default function CreateEvent({ guildId, employees }: { guildId: string, employees: RouterOutputs['web']['userOnGuild']['getEmployees'] }) {
    const route = useRouter()
    const utils = api.useUtils()
    const [coords, setCoords] = useState<{ lat: number, lng: number }>({ lat: -26.813688063759642, lng: -65.29143912682017 })
    const [step, setStep] = useState<'DETAILS' | 'GATES' | 'LOCATION' | 'TICKETS' | 'DEPOSITS' | 'PRODUCTS' | 'ARTISTS' | 'COUNTERS' | 'PRODUCTSONDEPOSIT'>('DETAILS')
    const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
    const mapRef = useRef<GoogleMap>(null)

    const getEmployees = api.web.userOnGuild.getEmployees.useQuery({ guildId }, {
        initialData: employees
    })

    const createEvent = api.web.event.create.useMutation({
        onSuccess: async (event) => {
            console.log("[createEvent] Datos enviados correctamente, evento creado:", event?.id)
            toast.success("Evento creado con éxito")
            await utils.web.event.byGuildId.invalidate()
            if (event?.id) {
                route.push(`/v1/${guildId}/events/${event.id}`)
            } else {
                route.push(`/v1/${guildId}/events`)
            }
        },
        onError: (error) => {
            console.error("[createEvent] Error del servidor:", error)
            toast.error(error.message ?? "Error al crear el evento")
        }
    })

    const [productImageUploading, setProductImageUploading] = useState(false)
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([])

    const employeeTable = useReactTable({
        data: getEmployees.data,
        columns: employeesColumns,
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

    const completeEventForm = useForm<z.infer<typeof completeEventSchema>>({
        resolver: zodResolver(completeEventSchema),
        defaultValues: {
            name: "",
            about: "",
            image: "",
            startsAt: customdayjs().add(1, "day").toISOString(),
            endsAt: customdayjs().add(1, "day").add(1, "hour").toISOString(),
            private: false,
            location: {
                name: "",
                latitude: undefined,
                longitude: undefined,
                iana: "UTC",
                city: "",
                country: "",
                address: "",
                image: "",
            },
            gates: [],
            tickets: [],
            artists: undefined,
            deposits: undefined,
            products: undefined,
        },
        mode: "onChange"
    })

    const onSubmitCompleteEvent = async (values: z.infer<typeof completeEventSchema>) => {
        console.log("[createEvent] Datos enviados:", values)
        createEvent.mutate({ ...values, guildId })
    }

    const onValidationError = (errors: Record<string, unknown>) => {
        console.error("[createEvent] Errores de validación:", errors)
        const flatten = (obj: unknown, path = ""): string[] => {
            if (!obj || typeof obj !== "object") return []
            const entries = Object.entries(obj as Record<string, unknown>)
            return entries.flatMap(([k, v]) =>
                v && typeof v === "object" && "message" in v && typeof (v as { message?: string }).message === "string"
                    ? [(v as { message: string }).message]
                    : flatten(v, `${path}.${k}`)
            )
        }
        const messages = flatten(errors)
        const hasLocationError = "location" in errors
        const msg = hasLocationError
            ? "Por favor, selecciona una ubicación válida en el mapa para obtener las coordenadas."
            : (messages[0] ?? "Revisa los campos del formulario")
        toast.error(msg)
    }

    const searchForm = useForm<z.infer<typeof searchSchema>>({
        resolver: zodResolver(searchSchema),
        defaultValues: {
            search: ""
        },
        mode: "onChange"
    })

    const onSubmitSearch = async (values: z.infer<typeof searchSchema>) => {
        console.log(values, "VALUES DEL FORM!")
    }

    const gateForm = useForm<z.infer<typeof gateSchema>>({
        resolver: zodResolver(gateSchema),
        defaultValues: {
            name: "",
            about: "",
            employees: []
        },
        mode: "onSubmit"
    })

    const onSubmitGate = async (values: z.infer<typeof gateSchema>) => {
        console.log(values, "VALUES DEL FORM!")
        if (completeEventForm.watch('gates')?.some((gate) => gate.name === values.name)) {
            gateForm.setError('name', { message: 'Ya existe esta puerta' })
        } else {
            completeEventForm.setValue("gates", [...completeEventForm.watch("gates"), { name: values.name, about: values.about, employees: employeeTable.getSelectedRowModel().rows.map(row => row.original.id) }])
            employeeTable.resetRowSelection(true)
            gateForm.reset()
        }
    }

    const depositForm = useForm<z.infer<typeof depositSchema>>({
        resolver: zodResolver(depositSchema),
        defaultValues: {
            name: "",
            about: "",
            products: []
        },
        mode: "onChange"
    })

    const onSubmitDeposit = async (values: z.infer<typeof depositSchema>) => {
        console.log(values, "VALUES DEL FORM!")
        if (completeEventForm.watch('deposits')?.some((deposit) => deposit.name === values.name)) {
            depositForm.setError('name', { message: 'Ya existe este deposito' })
        } else {
            const a = completeEventForm.watch('deposits') ?? []
            completeEventForm.setValue('deposits', [...a, { ...values, counters: [], productsOnDeposit: [] }])
            depositForm.reset()
        }
    }

    const counterForm = useForm<z.infer<typeof counterSchema>>({
        resolver: zodResolver(counterSchema),
        defaultValues: {
            name: "",
            about: "",
            employees: [],
            deposit: ""
        },
        mode: "onChange"
    })

    const onSubmitCounter = async (values: z.infer<typeof counterSchema>) => {
        console.log(values, "VALUES DEL FORM!")
        if (completeEventForm.watch('deposits')?.some((deposit) => deposit.counters.some((counter) => counter.name === values.name))) {
            counterForm.setError('name', { message: `Este mostrador ya existe` })
        } else {
            const deposits = completeEventForm.watch('deposits') ?? []
            deposits.map((dep, index) => {
                if (dep.name === values.deposit) {
                    const { deposit, employees, ...a } = values
                    deposits[index]?.counters.push({ ...a, employees: employeeTable.getSelectedRowModel().rows.map(row => row.original.id) })
                }
            })
            console.log("new deposit", deposits)
            completeEventForm.setValue('deposits', deposits)
            employeeTable.resetRowSelection(true)
            counterForm.reset()
        }
    }

    const ticketForm = useForm<z.infer<typeof ticketSchema>>({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            name: "",
            about: "",
            price: 0,
            quantity: 1,
            validUntil: undefined
        },
        mode: "onChange"
    })

    const onSubmitTicket = async (values: z.infer<typeof ticketSchema>) => {
        console.log(values, "VALUES DEL FORM!")
        if (completeEventForm.watch('tickets')?.some((tick) => tick.name === values.name)) {
            ticketForm.setError('name', { message: 'Ya existe este ticket' })
        } else {
            completeEventForm.setValue("tickets", [...completeEventForm.watch("tickets"), values])
            ticketForm.reset()
        }
    }

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

    const onSubmitProduct = async (values: z.infer<typeof productSchema>) => {
        console.log(values, "VALUES DEL FORM!")
        if (completeEventForm.watch('products')?.some((prod) => prod.name === values.name)) {
            productForm.setError('name', { message: 'Ya existe este producto' })
        } else {
            completeEventForm.setValue("products", [...completeEventForm.watch("products") ?? [], values])
            productForm.reset()
        }
    }

    const artistForm = useForm<z.infer<typeof artistSchema>>({
        resolver: zodResolver(artistSchema),
        defaultValues: {
            name: "",
            image: "",
        },
        mode: "onChange"
    })

    const onSubmitArtist = async (values: z.infer<typeof artistSchema>) => {
        console.log(values, "VALUES DEL FORM!")
        if (completeEventForm.watch('artists')?.some((art) => art.name === values.name)) {
            artistForm.setError('name', { message: 'Ya existe este artista' })
        } else {
            completeEventForm.setValue("artists", [...completeEventForm.watch("artists") ?? [], values])
            artistForm.reset()
        }
    }

    const productOnDepositForm = useForm<z.infer<typeof productOnDepositSchema>>({
        resolver: zodResolver(productOnDepositSchema),
        defaultValues: {
            productName: "",
            depositName: "",
            quantity: 1
        },
        mode: "onChange"
    })

    const onSubmitProductOnDeposit = async (values: z.infer<typeof productOnDepositSchema>) => {
        console.log(values, "VALUES DEL FORM!")
        if (completeEventForm.watch('deposits')?.some(depo => depo.name === values.depositName && depo.productsOnDeposit.some((prod => prod.name === values.productName)))) {
            productOnDepositForm.setError('productName', { message: `Ya existe este producto en "${values.depositName}"` })
        } else {
            const deposits = completeEventForm.watch('deposits') ?? []
            deposits.map((dep, index) => {
                if (dep.name === values.depositName) {
                    deposits[index]?.productsOnDeposit.push({ quantity: values.quantity, name: values.productName })
                }
            })
            console.log("new deposit", deposits)
            completeEventForm.setValue('deposits', deposits)
            productOnDepositForm.reset()
        }
    }

    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey,
        libraries,
    })

    const onPlacesChanged = () => {
        const place = searchBox?.getPlaces()![0]!
        console.log(place, "place")
        const fillForm: LocationSearch = {}
        if (place) {
            place?.address_components?.map((item) => {
                item.types.map((secondItem) => {
                    switch (secondItem) {
                        case 'street_number':
                            fillForm.street_number = item.short_name
                            break;
                        case 'route':
                            fillForm.route = item.long_name
                            completeEventForm.setValue("location.address", item.long_name)
                            break;
                        case 'administrative_area_level_1':
                            fillForm.state = item.long_name
                            break;
                        case "country":
                            fillForm.country = item.short_name
                            break;
                        case "locality":
                            fillForm.locality = item.long_name
                            break;
                        case 'postal_code':
                            fillForm.postal_code = item.long_name
                            break;

                        default:
                            break;
                    }
                })
            })

            if (fillForm.street_number && fillForm.route) {
                completeEventForm.setValue("location.address", fillForm.route + " " + fillForm.street_number)
            }

            if (place.name) {
                completeEventForm.setValue("location.name", place.name)
            }

            if (fillForm.country) {
                completeEventForm.setValue("location.country", fillForm.country)
            }

            if (fillForm.state) {
                completeEventForm.setValue("location.state", fillForm.state)
            }

            if (fillForm.locality) {
                completeEventForm.setValue("location.city", fillForm.locality)
            }

            console.log(fillForm, 'FILL FORM!', completeEventForm.watch())

            console.log(JSON.stringify(place?.geometry?.location))
            setCoords({ lat: place?.geometry?.location?.lat()!, lng: place?.geometry?.location?.lng()! })
            completeEventForm.setValue('location.latitude', place?.geometry?.location?.lat()!)
            completeEventForm.setValue('location.longitude', place?.geometry?.location?.lng()!)
        } else {
            console.log("place not found")
        }
        // return mapRef && mapRef.current?.panTo(searchBox.getPlaces()[0]?.geometry?.location)
    };

    const onSearchBoxLoad = (ref: any) => {
        setSearchBox(ref);
    }

return (
        <div className="flex flex-1 items-center justify-center">
            <div className="max-w-7xl w-full">
                <Return />
                <div className="flex flex-1 justify-between items-start">
                    <CardHeader className="pt-2">
                        <CardTitle>Crear evento</CardTitle>
                        <CardDescription>
                            Aqui deberas ingresar los detalles de tu evento, artistas, tiendas, barras, empleados, etc.
                        </CardDescription>
                    </CardHeader>
                    <Button
                        disabled={createEvent.isPending}
                        type="button"
                        onClick={() => {
                            if (!googleMapsApiKey) {
                                toast.error("Falta la clave de Google Maps. Añade NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env")
                                return
                            }
                            if (loadError) {
                                toast.error("El mapa no pudo cargar. Verifica la API key y que Maps JavaScript API y Places API estén habilitados en Google Cloud Console.")
                                return
                            }
                            completeEventForm.handleSubmit(onSubmitCompleteEvent, onValidationError)()
                        }}
                        variant={"default"}
                    >
                        {createEvent.isPending ?
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            :
                            "Confirmar y crear evento"
                        }
                    </Button>
                </div>
                <CardContent className="px-0">
                    <div className="flex flex-1 flex-row items-start justify-center gap-5">
                        <Nav
                            isCollapsed={false}
                            setStep={(prop) => { if (!(step === prop && (prop === 'GATES' || prop === 'COUNTERS'))) { employeeTable.resetRowSelection(true) }; setStep(prop) }}
                            links={[
                                {
                                    title: "Detalles del evento",
                                    label: "",
                                    icon: SquarePen,
                                    variant: "ghost",
                                    step: "DETAILS"
                                },
                                {
                                    title: "Ubicación",
                                    label: "",
                                    icon: MapPinned,
                                    variant: "ghost",
                                    step: "LOCATION"
                                },
                                {
                                    title: "Tickets",
                                    label: "",
                                    icon: Ticket,
                                    variant: "ghost",
                                    step: "TICKETS"
                                },
                                {
                                    title: "Puertas",
                                    label: "",
                                    icon: DoorOpen,
                                    variant: "ghost",
                                    step: "GATES"
                                },
                                {
                                    title: "Productos",
                                    label: "",
                                    icon: Pizza,
                                    variant: "ghost",
                                    step: "PRODUCTS"
                                },
                                {
                                    title: "Depositos",
                                    label: "",
                                    icon: Warehouse,
                                    variant: "ghost",
                                    step: "DEPOSITS"
                                },
                                {
                                    title: "Mostradores",
                                    label: "",
                                    icon: Container,
                                    variant: "ghost",
                                    step: "COUNTERS"
                                },
                                {
                                    title: "Productos en deposito",
                                    label: "",
                                    icon: Package,
                                    variant: "ghost",
                                    step: "PRODUCTSONDEPOSIT"
                                },
                                {
                                    title: "Artistas",
                                    label: "",
                                    icon: Mic2,
                                    variant: "ghost",
                                    step: "ARTISTS"
                                },
                            ]}
                        />
                        <div className="flex w-full h-full flex-1">
                            <div className={`flex w-full flex-col space-y-2 ${step === "DETAILS" ? "" : "hidden"}`}>
                                <Card className="w-full">
                                    <CardHeader className="mb-0 pb-2">
                                        <CardTitle>Detalles del evento</CardTitle>
                                        <CardDescription className="max-w-3xl">Descripción detalles evento.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex w-full flex-col space-y-2">
                                        <Form {...completeEventForm}>
                                            <form onSubmit={completeEventForm.handleSubmit(onSubmitCompleteEvent)} className="flex w-full flex-col space-y-2">
                                                <div className="flex w-full gap-5">
                                                    <FormField
                                                        control={completeEventForm.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <FormLabel>Nombre*</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Ej: Vox Night Club" {...field} />
                                                                </FormControl>
                                                                <FormDescription>Nombre visible al público.</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={completeEventForm.control}
                                                        name="image"
                                                        render={({ field }) => (
                                                            <FormItem {...field} className="w-full">
                                                                <FormLabel>Foto*</FormLabel>
                                                                <FormControl className="">
                                                                    <div className="flex items-center justify-center">
                                                                        {completeEventForm.watch("image") ? (
                                                                            <div className="flex w-full items-start justify-start space-y-4 gap-5">
                                                                                <Avatar className="h-20 w-20">
                                                                                    <AvatarImage style={{ objectFit: "cover" }} src={completeEventForm.watch("image") ?? ""} alt="profile-image" />
                                                                                    <AvatarFallback><Icons.spinner className="h-5 w-5 animate-spin" /></AvatarFallback>
                                                                                </Avatar>
                                                                                <Button type="button" variant="outline" onClick={() => completeEventForm.setValue("image", "")}>Cambiar imagen</Button>
                                                                            </div>
                                                                        ) : (
                                                                            <Input
                                                                                id="image"
                                                                                type="file"
                                                                                accept=".jpg,.jpeg,.png"
                                                                                onChange={async (e) => {
                                                                                    const file = e.target.files?.[0]
                                                                                    if (!file) return
                                                                                    const formData = new FormData()
                                                                                    formData.append("file", file)
                                                                                    const res = await fetch("/api/upload", { method: "POST", body: formData })
                                                                                    const result = await res.json()
                                                                                    if (res.ok && result.url) completeEventForm.setValue("image", result.url)
                                                                                    else toast.error(result.error ?? "Error al subir la imagen.")
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </FormControl>
                                                                <FormDescription>Solo se permiten archivos .jpg y .jpeg de hasta 3MB.</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <FormField control={completeEventForm.control} name="about" render={({ field }) => (
                                                    <FormItem className="w-full">
                                                        <FormLabel>Descripción</FormLabel>
                                                        <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <div className="flex w-full gap-5">
                                                    <FormField control={completeEventForm.control} name="startsAt" render={({ field }) => (
                                                        <FormItem className="w-full">
                                                            <FormLabel>Comienza</FormLabel>
                                                            <FormControl>
                                                                <Input type="datetime-local" {...field} onChange={(e) => field.onChange(e.target.value)} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                    <FormField control={completeEventForm.control} name="endsAt" render={({ field }) => (
                                                        <FormItem className="w-full">
                                                            <FormLabel>Termina</FormLabel>
                                                            <FormControl>
                                                                <Input type="datetime-local" {...field} onChange={(e) => field.onChange(e.target.value)} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                </div>
                                                <FormField control={completeEventForm.control} name="private" render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <FormLabel>Evento privado</FormLabel>
                                                        <FormControl><Toggle checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                    </FormItem>
                                                )} />
                                            </form>
                                        </Form>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className={`flex w-full flex-col space-y-2 ${step === "LOCATION" ? "" : "hidden"}`}>
                                <Card className="w-full">
                                    {!googleMapsApiKey ? (
                                        <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 py-8">
                                            <p className="text-destructive font-medium">Falta la clave de Google Maps</p>
                                            <p className="text-muted-foreground text-sm text-center max-w-md">Añade <code className="bg-muted px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> en tu archivo <code className="bg-muted px-1 rounded">.env</code>.</p>
                                        </CardContent>
                                    ) : loadError ? (
                                        <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 py-8">
                                            <p className="text-destructive font-medium">El mapa no pudo cargar</p>
                                            <p className="text-muted-foreground text-sm text-center max-w-md">Verifica la API key y que Maps JavaScript API y Places API estén habilitados.</p>
                                        </CardContent>
                                    ) : !isLoaded ? (
                                        <div className="flex flex-1 items-center justify-center py-8">
                                            <Icons.spinner className="mr-2 h-10 w-10 animate-spin" />
                                            <span className="text-sm text-muted-foreground">Cargando mapa...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <CardHeader className="mb-0 pb-2">
                                                <CardTitle>Ubicación</CardTitle>
                                                <CardDescription className="max-w-3xl">Busca la dirección en Google Maps y se autocompletarán los datos.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex w-full flex-col space-y-2">
                                                <div className="pb-4 w-full">
                                                    <Form {...searchForm}>
                                                        <form onSubmit={searchForm.handleSubmit(onSubmitSearch)} className="flex w-full flex-col">
                                                            <FormField control={searchForm.control} name="search" render={({ field }) => (
                                                                <FormItem {...field} className="pb-2">
                                                                    <FormLabel>Búsqueda</FormLabel>
                                                                    <FormControl>
                                                                        <StandaloneSearchBox onPlacesChanged={onPlacesChanged} onLoad={onSearchBoxLoad}>
                                                                            <Input type="text" placeholder="Buscar dirección en Google Maps" {...field} />
                                                                        </StandaloneSearchBox>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            <div className="w-full h-[30vh]">
                                                                <GoogleMap
                                                                    options={{ backgroundColor: "#222", fullscreenControl: false, streetViewControl: false, mapTypeControl: false, styles: mapStyle, center: coords }}
                                                                    onClick={(e: google.maps.MapMouseEvent) => {
                                                                        const latLng = e.latLng
                                                                        if (!latLng) return
                                                                        const lat = typeof latLng.lat === "function" ? latLng.lat() : latLng.lat
                                                                        const lng = typeof latLng.lng === "function" ? latLng.lng() : latLng.lng
                                                                        setCoords({ lat, lng })
                                                                        completeEventForm.setValue("location.latitude", lat)
                                                                        completeEventForm.setValue("location.longitude", lng)
                                                                    }}
                                                                    zoom={15}
                                                                    center={coords}
                                                                    ref={mapRef}
                                                                    mapContainerClassName="w-full h-full"
                                                                >
                                                                    {completeEventForm.watch("location.latitude") != null && completeEventForm.watch("location.longitude") != null && (
                                                                        <Marker position={{ lat: completeEventForm.watch("location.latitude")!, lng: completeEventForm.watch("location.longitude")! }} />
                                                                    )}
                                                                </GoogleMap>
                                                            </div>
                                                        </form>
                                                    </Form>
                                                </div>
                                                <Form {...completeEventForm}>
                                                    <form onSubmit={completeEventForm.handleSubmit(onSubmitCompleteEvent)} className="flex w-full flex-col space-y-2">
                                                        <div className="flex w-full gap-5">
                                                            <FormField control={completeEventForm.control} name="location.name" render={({ field }) => (
                                                                <FormItem className="w-full"><FormLabel>Nombre*</FormLabel><FormControl><Input placeholder="Ej: Vox Night Club" {...field} /></FormControl><FormMessage /></FormItem>
                                                            )} />
                                                            <FormField control={completeEventForm.control} name="location.address" render={({ field }) => (
                                                                <FormItem className="w-full"><FormLabel>Dirección*</FormLabel><FormControl><Input placeholder="Ej: Calle 123" {...field} /></FormControl><FormMessage /></FormItem>
                                                            )} />
                                                            <FormField control={completeEventForm.control} name="location.image" render={({ field }) => (
                                                                <FormItem {...field} className="w-full">
                                                                    <FormLabel>Foto*</FormLabel>
                                                                    <FormControl className="">
                                                                        <div className="flex items-center justify-center">
                                                                            {completeEventForm.watch("location.image") ? (
                                                                                <div className="flex w-full items-start justify-start space-y-4 gap-5">
                                                                                    <Avatar className="h-20 w-20">
                                                                                        <AvatarImage style={{ objectFit: "cover" }} src={completeEventForm.watch("location.image") ?? ""} alt="profile-image" />
                                                                                        <AvatarFallback><Icons.spinner className="h-5 w-5 animate-spin" /></AvatarFallback>
                                                                                    </Avatar>
                                                                                    <Button type="button" variant="outline" onClick={() => completeEventForm.setValue("location.image", "")}>Cambiar imagen</Button>
                                                                                </div>
                                                                            ) : (
                                                                                <Input type="file" accept=".jpg,.jpeg,.png" onChange={async (e) => {
                                                                                    const file = e.target.files?.[0]
                                                                                    if (!file) return
                                                                                    const formData = new FormData()
                                                                                    formData.append("file", file)
                                                                                    formData.append("prefix", "events")
                                                                                    const res = await fetch("/api/upload", { method: "POST", body: formData })
                                                                                    const result = await res.json()
                                                                                    if (res.ok && result.url) completeEventForm.setValue("location.image", result.url)
                                                                                    else toast.error(result.error ?? "Error al subir la imagen.")
                                                                                }} />
                                                                            )}
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormDescription>Solo se permiten archivos .jpg y .jpeg de hasta 3MB.</FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </div>
                                                        <div className="flex w-full gap-5">
                                                            <FormField control={completeEventForm.control} name="location.country" render={({ field }) => (
                                                                <FormItem className="w-full">
                                                                    <FormLabel>País *</FormLabel>
                                                                    <FormControl>
                                                                        <div className="w-full flex-1 rounded-md border px-2 bg-background">
                                                                            <CountryDropdown value={field.value as string} valueType="short" onChange={(val) => field.onChange(val)} defaultOptionLabel="Seleccionar" classes="py-[.6rem] w-full text-sm bg-background" />
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={completeEventForm.control} name="location.state" render={({ field }) => (
                                                                <FormItem className="w-full">
                                                                    <FormLabel>Provincia *</FormLabel>
                                                                    <FormControl>
                                                                        <div className="w-full flex-1 rounded-md border px-2 bg-background">
                                                                            <RegionDropdown country={completeEventForm.watch("location.country")} value={field.value as string} defaultOptionLabel="Seleccionar" countryValueType="short" classes="py-[.6rem] w-full text-sm bg-background" onChange={(val) => field.onChange(val)} />
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={completeEventForm.control} name="location.city" render={({ field }) => (
                                                                <FormItem className="w-full"><FormLabel>Ciudad *</FormLabel><FormControl><Input placeholder="Ej: CABA" {...field} /></FormControl><FormMessage /></FormItem>
                                                            )} />
                                                        </div>
                                                    </form>
                                                </Form>
                                            </CardContent>
                                        </>
                                    )}
                                </Card>
                            </div>
                            <div className={`flex w-full gap-5 ${step === "GATES" ? "" : "hidden"}`}>
                                <Card className="flex-1">
                                    <CardHeader className="mb-0 pb-2">
                                        <CardTitle>
                                            Puertas
                                        </CardTitle>
                                        <CardDescription className="max-w-3xl">
                                            Descripci├│n puertas.
                                        </CardDescription>
                                    </CardHeader>
                                    <Form {...gateForm}>
                                        <form onSubmit={gateForm.handleSubmit(onSubmitGate)} className="flex w-full flex-col space-y-2">
                                            <CardContent className="flex flex-1 gap-10">
                                                <div className={`flex flex-1 w-full flex-col space-y-2`}>
                                                    <div className="flex w-full gap-5">
                                                        <FormField
                                                            control={gateForm.control}
                                                            name="name"
                                                            render={({ field }) => (
                                                                <FormItem className="w-full">
                                                                    <FormLabel>Nombre*</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Ej: Vox Night Club" {...field} />
                                                                    </FormControl>
                                                                    <FormDescription>
                                                                        Nombre visible al p├║blico.
                                                                    </FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className='flex gap-5'>
                                                        <FormField
                                                            control={gateForm.control}
                                                            name="about"
                                                            render={({ field }) => (
                                                                <FormItem className="w-full">
                                                                    <FormLabel>Descripci├│n</FormLabel>
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
                                                    <div className='flex flex-1 justify-center items-center w-full'>
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
                                                                            {employeeTable.getHeaderGroups().map((headerGroup) => (
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
                                                                            {employeeTable.getRowModel().rows?.length ? (
                                                                                employeeTable.getRowModel().rows.map((row) => (
                                                                                    <TableRow
                                                                                        className={`w-full ${row.getIsSelected() ? "bg-zinc-800" : ""}`}
                                                                                        key={row.id}
                                                                                        data-state={row.getIsSelected() && "selected"}
                                                                                        onClick={() => {
                                                                                            row.toggleSelected(!row.getIsSelected())
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
                                                                                        colSpan={employeesColumns.length}
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
                                                                <DataTablePagination table={employeeTable} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex items-center justify-center">
                                                <Button variant={"outline"} type="submit">
                                                    Agregar puerta
                                                </Button>
                                            </CardFooter>
                                        </form>
                                    </Form>
                                </Card>
                                <Card className="flex-1">
                                    <CardHeader>
                                        <CardTitle>
                                            Puertas creadas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className={`h-80 rounded-md pb-0`}>
                                            {completeEventForm.watch('gates').length > 0 ?
                                                <>
                                                    {completeEventForm.watch('gates').map((gate, index) => {
                                                        return (
                                                            <div className="pb-4" key={index.toString()}>
                                                                <div className='flex flex-1 justify-between items-center gap-2'>
                                                                    <div className='space-y-1'>
                                                                        <h1 className="font-bold">{gate.name}</h1>
                                                                        <p>{gate.about}</p>
                                                                    </div>
                                                                    <Toggle aria-label="Toggle bold">
                                                                        <X className="h-5 w-5" color="white" onClick={() => {
                                                                            completeEventForm.setValue('gates', completeEventForm.watch('gates').filter((_, i) => index !== i))
                                                                        }} />
                                                                    </Toggle>
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
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className={`flex w-full gap-5 ${step === "COUNTERS" ? "" : "hidden"}`}>
                                <Card className="flex-1">
                                    <CardHeader className="mb-0 pb-2">
                                        <CardTitle>
                                            Mostradores
                                        </CardTitle>
                                        <CardDescription className="max-w-3xl">
                                            Descripci├│n barras.
                                        </CardDescription>
                                    </CardHeader>
                                    <Form {...counterForm}>
                                        <form onSubmit={counterForm.handleSubmit(onSubmitCounter)} className="flex w-full flex-col space-y-2">
                                            <CardContent className={`flex-col flex-1 gap-10`}>
                                                <div className={`flex w-full flex-col space-y-2`}>
                                                    <div className="flex w-full gap-5">
                                                        <FormField
                                                            control={counterForm.control}
                                                            name="deposit"
                                                            render={({ field }) => (
                                                                <FormItem className="">
                                                                    <FormLabel>Deposito*</FormLabel>
                                                                    <FormControl>
                                                                        <Select value={field.value} onValueChange={(val) => field.onChange(val)} disabled={!completeEventForm.watch('deposits') || completeEventForm.watch('deposits')?.length === 0}>
                                                                            <SelectTrigger className="w-[180px]">
                                                                                <SelectValue placeholder="Seleccionar" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectGroup>
                                                                                    {completeEventForm.watch('deposits')?.map((deposit) => {
                                                                                        return <SelectItem value={deposit.name}>{deposit.name}</SelectItem>
                                                                                    })}
                                                                                </SelectGroup>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </FormControl>
                                                                    <FormDescription>
                                                                        De aqu├¡ se sacar├ín los productos
                                                                    </FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={counterForm.control}
                                                            name="name"
                                                            render={({ field }) => (
                                                                <FormItem className="w-full">
                                                                    <FormLabel>Nombre*</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Ej: Vox Night Club" {...field} />
                                                                    </FormControl>
                                                                    <FormDescription>
                                                                        Nombre visible al p├║blico.
                                                                    </FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className='flex gap-5'>
                                                        <FormField
                                                            control={counterForm.control}
                                                            name="about"
                                                            render={({ field }) => (
                                                                <FormItem className="w-full">
                                                                    <FormLabel>Descripci├│n</FormLabel>
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
                                                </div>
                                                <div className='flex flex-1 justify-center items-center w-full'>
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
                                                                        {employeeTable.getHeaderGroups().map((headerGroup) => (
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
                                                                        {employeeTable.getRowModel().rows?.length ? (
                                                                            employeeTable.getRowModel().rows.map((row) => (
                                                                                <TableRow
                                                                                    className={`w-full ${row.getIsSelected() ? "bg-zinc-800" : ""}`}
                                                                                    key={row.id}
                                                                                    data-state={row.getIsSelected() && "selected"}
                                                                                    onClick={() => {
                                                                                        row.toggleSelected(!row.getIsSelected())
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
                                                                                    colSpan={employeesColumns.length}
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
                                                            <DataTablePagination table={employeeTable} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex items-center justify-center">
                                                <Button variant={"outline"} type="submit">
                                                    Agregar mostrador
                                                </Button>
                                            </CardFooter>
                                        </form>
                                    </Form>
                                </Card>
                                <Card className="flex-1">
                                    <CardHeader>
                                        <CardTitle>Mostradores creados</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className={`h-80 rounded-md pb-0`}>
                                            {(completeEventForm.watch('deposits') ?? []).length > 0 && completeEventForm.watch('deposits')?.some(dep => dep.counters.length > 0) ?
                                                <div>
                                                    {completeEventForm.watch('deposits')?.map((deposit, indexDep) =>
                                                        <Fragment key={indexDep} >
                                                            {deposit.counters.map((counter, indexCounter) => {
                                                                return (
                                                                    <div className="pb-4" key={indexCounter.toString()}>
                                                                        <div className='flex flex-1 justify-between items-center gap-2'>
                                                                            <div className='space-y-1'>
                                                                                <h1 className="font-bold">{counter.name}</h1>
                                                                                <p>{counter.about}</p>
                                                                            </div>
                                                                            <Toggle aria-label="Toggle bold">
                                                                                <X className="h-5 w-5" color="white" onClick={() => {
                                                                                    const depositsCorrected = completeEventForm.watch('deposits')
                                                                                    if (depositsCorrected?.[indexDep]?.counters) {
                                                                                        depositsCorrected[indexDep].counters = depositsCorrected[indexDep]?.counters.filter((_, i) => indexCounter !== i) ?? []
                                                                                        completeEventForm.setValue('deposits', depositsCorrected)
                                                                                    }
                                                                                }} />
                                                                            </Toggle>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </Fragment>
                                                    )}
                                                </div>
                                                :
                                                <div className='flex justify-center items-center'>
                                                    <p>No hay mostradores</p>
                                                </div>

                                            }
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className={`flex w-full flex-1 gap-5 ${step === "TICKETS" ? "" : "hidden"}`}>
                                <Card className="flex-1">
                                    <CardHeader className="mb-0 pb-2">
                                        <CardTitle>
                                            Tickets
                                        </CardTitle>
                                        <CardDescription className="max-w-3xl">
                                            Descripci├│n tickets.
                                        </CardDescription>
                                    </CardHeader>
                                    <Form {...ticketForm}>
                                        <form onSubmit={ticketForm.handleSubmit(onSubmitTicket)} className="flex w-full flex-col space-y-2">
                                            <CardContent className={`flex w-full flex-col space-y-2`}>
                                                <div className="flex w-full gap-5">
                                                    <FormField
                                                        control={ticketForm.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <FormLabel>Nombre*</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Ej: Vox Night Club" {...field} />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Nombre visible al p├║blico.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className='flex gap-5'>
                                                    <FormField
                                                        control={ticketForm.control}
                                                        name="about"
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <FormLabel>Descripci├│n</FormLabel>
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
                                                        control={ticketForm.control}
                                                        name="price"
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <FormLabel>Precio*</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Precio de la entrada
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={ticketForm.control}
                                                        name="quantity"
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <FormLabel>Cantidad*</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Ej: Calle 123" {...field} />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Cantidad de entradas a la venta
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={ticketForm.control}
                                                        name="validUntil"
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <FormLabel>Valido hasta</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="datetime-local"
                                                                        {...field}
                                                                        // defaultValue={customdayjs()}
                                                                        onChange={(event) => field.onChange(event.target.value)}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Hora hasta que la utilizada en una puerta por el portador.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex items-center justify-center">
                                                <Button variant={"outline"} type="submit">
                                                    Agregar ticket
                                                </Button>
                                            </CardFooter>
                                        </form>
                                    </Form>
                                </Card>
                                <Card className="flex-1">
                                    <CardHeader>
                                        <CardTitle>Tickets creados</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className={`h-80 rounded-md pb-0`}>
                                            {completeEventForm.watch('tickets').length > 0 ?
                                                <>
                                                    {completeEventForm.watch('tickets').map((ticket, index) => {
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
                                                                    <Toggle aria-label="Toggle bold">
                                                                        <X className="h-5 w-5" color="white" onClick={() => {
                                                                            completeEventForm.setValue('tickets', completeEventForm.watch('tickets').filter((_, i) => index !== i))
                                                                        }} />
                                                                    </Toggle>
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
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className={`flex w-full flex-1 gap-5  ${step === "ARTISTS" ? "" : "hidden"}`}>
                                <Card className="flex-1">
                                    <CardHeader className="mb-0 pb-2">
                                        <CardTitle>
                                            Artistas
                                        </CardTitle>
                                        <CardDescription className="max-w-3xl">
                                            Descripci├│n artistas.
                                        </CardDescription>
                                    </CardHeader>
                                    <Form {...artistForm}>
                                        <form onSubmit={artistForm.handleSubmit(onSubmitArtist)} className="flex w-full flex-col space-y-2">
                                            <CardContent className={`flex w-full flex-col space-y-2`}>
                                                <div className="flex flex-col w-full gap-5">
                                                    <FormField
                                                        control={artistForm.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <FormLabel>Nombre*</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Ej: Vox Night Club" {...field} />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Nombre visible al p├║blico.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={artistForm.control}
                                                        name="image"
                                                        render={({ field }) => (
                                                            <FormItem  {...field} className="w-full">
                                                                <FormLabel>Foto*</FormLabel>
                                                                <FormControl className="">
                                                                    <div className="flex items-center justify-center">
                                                                        {artistForm.watch("image") ?
                                                                            <div className="flex w-full items-start justify-start space-y-4 gap-5">
                                                                                <Avatar className="h-20 w-20">
                                                                                    <AvatarImage style={{ objectFit: "cover" }} src={artistForm.watch("image") ?? ""} alt="profile-image" />
                                                                                    <AvatarFallback>
                                                                                        <Icons.spinner className=" h-5 w-5 animate-spin" />
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <Button type="button" variant={"outline"} onClick={() => {
                                                                                    artistForm.setValue("image", "")
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
                                                                                    const file = e.target.files?.[0]
                                                                                    if (!file) return
                                                                                    const formData = new FormData()
                                                                                    formData.append("file", file)
                                                                                    formData.append("prefix", "artists")
                                                                                    const response = await fetch("/api/upload", { method: "POST", body: formData })
                                                                                    const result = (await response.json()) as { url?: string; error?: string }
                                                                                    if (response.ok && result.url) {
                                                                                        artistForm.setValue("image", result.url)
                                                                                        toast.success("Imagen subida correctamente")
                                                                                    } else {
                                                                                        toast.error(result.error ?? "Error al subir la imagen.")
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
                                            </CardContent>
                                            <CardFooter className="flex items-center justify-center">
                                                <Button variant={"outline"} type="submit">
                                                    Agregar artista
                                                </Button>
                                            </CardFooter>
                                        </form>
                                    </Form>
                                </Card>
                                <Card className="flex-1">
                                    <CardHeader>
                                        <CardTitle>Artistas creados</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className={`h-80 rounded-md pb-0`}>
                                            {(completeEventForm.watch('artists') ?? []).length > 0 ?
                                                <>
                                                    {completeEventForm.watch('artists')?.map((artist, index) => {
                                                        return (
                                                            <div className="pb-4" key={index.toString()}>
                                                                <div className='flex flex-1 justify-between items-center gap-2'>
                                                                    <div className='flex space-x-2 items-center'>
                                                                        <Avatar>
                                                                            <AvatarImage src={artist.image} alt="foto" />
                                                                            <AvatarFallback>FT</AvatarFallback>
                                                                        </Avatar>
                                                                        <h1 className="font-bold">{artist.name}</h1>
                                                                    </div>
                                                                    <Toggle aria-label="Toggle bold">
                                                                        <X className="h-5 w-5" color="white" onClick={() => {
                                                                            completeEventForm.setValue('artists', completeEventForm.watch('artists')?.filter((_, i) => index !== i))
                                                                        }} />
                                                                    </Toggle>
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
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className={`flex w-full flex-1 gap-5 ${step === "DEPOSITS" ? "" : "hidden"}`}>
                                <Card className="flex-1">
                                    <CardHeader className="mb-0 pb-2">
                                        <CardTitle>
                                            Depositos
                                        </CardTitle>
                                        <CardDescription className="max-w-3xl">
                                            Descripci├│n depositos.
                                        </CardDescription>
                                    </CardHeader>
                                    <Form {...depositForm}>
                                        <form onSubmit={depositForm.handleSubmit(onSubmitDeposit)} className="flex w-full flex-col space-y-2">
                                            <CardContent className={`flex w-full flex-col space-y-2`}>
                                                <div className="flex w-full gap-5">
                                                    <FormField
                                                        control={depositForm.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <FormLabel>Nombre*</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Ej: Vox Night Club" {...field} />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Nombre visible al p├║blico.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className='flex gap-5'>
                                                    <FormField
                                                        control={depositForm.control}
                                                        name="about"
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <FormLabel>Descripci├│n</FormLabel>
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
                                            </CardContent>
                                            <CardFooter className="flex items-center justify-center">
                                                <Button variant={"outline"} type="submit">
                                                    Agregar deposito
                                                </Button>
                                            </CardFooter>
                                        </form>
                                    </Form>
                                </Card>
                                <Card className="flex-1">
                                    <CardHeader>
                                        <CardTitle>Depositos creados</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className={`h-80 rounded-md pb-0`}>
                                            {(completeEventForm.watch('deposits') ?? []).length > 0 ?
                                                <>
                                                    {completeEventForm.watch('deposits')?.map((deposit, index) => {
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
                                                                                {deposit.productsOnDeposit.map((prod, pOnDepIndex) => {
                                                                                    return (
                                                                                        <div className="pb-4" key={index.toString()}>
                                                                                            <div className='flex flex-1 justify-between items-center gap-2'>
                                                                                                <div className='space-y-1'>
                                                                                                    <h1 className="font-bold">{prod.name}</h1>
                                                                                                </div>
                                                                                                <div className='flex flex-1 gap-1 items-center justify-end'>
                                                                                                    <p>{prod.quantity}</p>
                                                                                                    <p>ud</p>
                                                                                                </div>
                                                                                                <Toggle aria-label="Toggle bold">
                                                                                                    <X className="h-5 w-5" color="white" onClick={() => {
                                                                                                        const depositsCorrected = completeEventForm.watch('deposits')
                                                                                                        if (depositsCorrected?.[index]?.productsOnDeposit) {
                                                                                                            depositsCorrected[index].productsOnDeposit = depositsCorrected[index]?.productsOnDeposit.filter((_, i) => pOnDepIndex !== i) ?? []
                                                                                                            completeEventForm.setValue('deposits', depositsCorrected)
                                                                                                        }
                                                                                                    }} />
                                                                                                </Toggle>
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
                                                                        <Toggle aria-label="Toggle bold">
                                                                            <X color="white" onClick={() => {
                                                                                completeEventForm.setValue('deposits', completeEventForm.watch('deposits')?.filter((_, i) => index !== i) ?? [])
                                                                            }} />
                                                                        </Toggle>
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
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className={`flex w-full flex-1 gap-5 ${step === "PRODUCTSONDEPOSIT" ? "" : "hidden"}`}>
                                <Card className="flex-1">
                                    <CardHeader className="mb-0 pb-2">
                                        <CardTitle>
                                            Productos en un deposito
                                        </CardTitle>
                                        <CardDescription className="max-w-3xl">
                                            Descripci├│n productos en un deposito.
                                        </CardDescription>
                                    </CardHeader>
                                    <Form {...productOnDepositForm}>
                                        <form onSubmit={productOnDepositForm.handleSubmit(onSubmitProductOnDeposit)} className="flex w-full flex-col space-y-2">
                                            <CardContent className="flex flex-1 gap-10">
                                                <div className={`flex flex-col w-full gap-2`}>
                                                    <FormField
                                                        control={productOnDepositForm.control}
                                                        name="depositName"
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                                <FormLabel>Deposito*</FormLabel>
                                                                <FormControl>
                                                                    <Select value={field.value} onValueChange={(val) => field.onChange(val)} disabled={!completeEventForm.watch('deposits') || completeEventForm.watch('deposits')?.length === 0}>
                                                                        <SelectTrigger className="w-full">
                                                                            <SelectValue placeholder="Seleccionar" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectGroup>
                                                                                {completeEventForm.watch('deposits')?.map((deposit) => {
                                                                                    return <SelectItem value={deposit.name}>{deposit.name}</SelectItem>
                                                                                })}
                                                                            </SelectGroup>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormControl>
                                                                <FormDescription>
                                                                    De aqu├¡ se sacar├ín los productos
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={productOnDepositForm.control}
                                                        name="productName"
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <FormLabel>Producto*</FormLabel>
                                                                <FormControl>
                                                                    <Select value={field.value} onValueChange={(val) => field.onChange(val)} disabled={!completeEventForm.watch('products') || completeEventForm.watch('products')?.length === 0}>
                                                                        <SelectTrigger className="w-full">
                                                                            <SelectValue placeholder="Seleccionar" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectGroup>
                                                                                {completeEventForm.watch('products')?.map((product) => {
                                                                                    return <SelectItem value={product.name}>{product.name}</SelectItem>
                                                                                })}
                                                                            </SelectGroup>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormControl>
                                                                <FormDescription>
                                                                    De aqu├¡ se sacar├ín los productos
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={productOnDepositForm.control}
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
                                                <Button variant={"outline"} type="submit">
                                                    Agregar
                                                </Button>
                                            </CardFooter>
                                        </form>
                                    </Form>
                                </Card>
                                <Card className="flex-1">
                                    <CardHeader>
                                        <CardTitle>Depositos y sus productos</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className={`h-80 rounded-md pb-0`}>
                                            {(completeEventForm.watch('deposits') ?? []).length > 0 ?
                                                <>
                                                    {completeEventForm.watch('deposits')?.map((deposit, index) => {
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
                                                                                {deposit.productsOnDeposit.map((prod, pOnDepIndex) => {
                                                                                    return (
                                                                                        <div className="pb-4" key={pOnDepIndex.toString()}>
                                                                                            <div className='flex flex-1 justify-between items-center gap-2'>
                                                                                                <div className='space-y-1'>
                                                                                                    <h1 className="font-bold">{prod.name}</h1>
                                                                                                </div>
                                                                                                <div className='flex flex-1 gap-1 items-center justify-end'>
                                                                                                    <p>{prod.quantity}</p>
                                                                                                    <p>ud</p>
                                                                                                </div>
                                                                                                <Toggle aria-label="Toggle bold">
                                                                                                    <X className="h-5 w-5" color="white" onClick={() => {
                                                                                                        const depositsCorrected = completeEventForm.watch('deposits')
                                                                                                        if (depositsCorrected?.[index]?.productsOnDeposit) {
                                                                                                            depositsCorrected[index].productsOnDeposit = depositsCorrected[index]?.productsOnDeposit.filter((_, i) => pOnDepIndex !== i) ?? []
                                                                                                            completeEventForm.setValue('deposits', depositsCorrected)
                                                                                                        }
                                                                                                    }} />
                                                                                                </Toggle>
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
                                                                        <Toggle aria-label="Toggle bold">
                                                                            <X color="white" onClick={() => {
                                                                                completeEventForm.setValue('deposits', completeEventForm.watch('deposits')?.filter((_, i) => index !== i) ?? [])
                                                                            }} />
                                                                        </Toggle>
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
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className={`flex w-full flex-1 gap-5 ${step === "PRODUCTS" ? "" : "hidden"}`}>
                                <Card className="w-full">
                                    <CardHeader className="mb-0 pb-2">
                                        <CardTitle>
                                            Productos
                                        </CardTitle>
                                        <CardDescription className="max-w-3xl">
                                            Descripci├│n productos.
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
                                                                    Nombre visible al p├║blico.
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
                                                                                accept=".jpg,.jpeg,.png"
                                                                                disabled={productImageUploading}
                                                                                onChange={async (e) => {
                                                                                    const file = e.target.files?.[0]
                                                                                    if (!file) return
                                                                                    setProductImageUploading(true)
                                                                                    try {
                                                                                        const formData = new FormData()
                                                                                        formData.append("file", file)
                                                                                        formData.append("prefix", "products")
                                                                                        const response = await fetch("/api/upload", { method: "POST", body: formData })
                                                                                        const result = (await response.json()) as { url?: string; error?: string }
                                                                                        if (response.ok && result.url) {
                                                                                            productForm.setValue("image", result.url)
                                                                                            toast.success("Imagen subida correctamente")
                                                                                        } else {
                                                                                            toast.error(result.error ?? "Error al subir la imagen.")
                                                                                        }
                                                                                    } catch (err) {
                                                                                        toast.error(err instanceof Error ? err.message : "Error de red")
                                                                                    } finally {
                                                                                        setProductImageUploading(false)
                                                                                    }
                                                                                }}
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
                                                                <FormLabel>Descripci├│n</FormLabel>
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
                                                    Agregar producto
                                                </Button>
                                            </CardFooter>
                                        </form>
                                    </Form>
                                </Card>
                                <Card className="w-full">
                                    <CardHeader>
                                        <CardTitle>Productos creados</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className={`h-80 rounded-md pb-0`}>
                                            {(completeEventForm.watch('products') ?? []).length > 0 ?
                                                <>
                                                    {completeEventForm.watch('products')?.map((prod, index) => {
                                                        return (
                                                            <div className="pb-4" key={index.toString()}>
                                                                <div className='flex flex-1 justify-between items-center gap-2'>
                                                                    <div className='flex space-x-2 items-center'>
                                                                        <Avatar>
                                                                            <AvatarImage src={prod.image} alt="@shadcn" />
                                                                            <AvatarFallback>AR</AvatarFallback>
                                                                        </Avatar>
                                                                        <div className='space-y-1'>
                                                                            <h1 className="font-bold">{prod.name} {prod.type === "FOOD" ? "(COMIDA)" : prod.type === "DRINK" ? "(BEBIDA)" : "(CONSUMIBLE)"}</h1>
                                                                            <p>
                                                                                {prod.about}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className='flex flex-1 gap-1 items-center justify-end'>
                                                                        <p>${prod.price.toLocaleString()}</p>
                                                                    </div>
                                                                    <Toggle aria-label="Toggle bold">
                                                                        <X className="h-5 w-5" color="white" onClick={() => {
                                                                            completeEventForm.setValue('products', completeEventForm.watch('products')?.filter((_, i) => index !== i))
                                                                            const deposits = completeEventForm.watch('deposits') ?? []
                                                                            deposits.map((dep, depIndex) => {
                                                                                if (deposits[depIndex]?.productsOnDeposit) {
                                                                                    deposits[depIndex].productsOnDeposit = deposits[depIndex]?.productsOnDeposit.filter(prodOnDep => prodOnDep.name !== prod.name) ?? []
                                                                                }
                                                                            })
                                                                            if (productOnDepositForm.watch('productName') === prod.name) {
                                                                                productOnDepositForm.resetField('productName')
                                                                            }
                                                                            completeEventForm.setValue('deposits', deposits)
                                                                        }} />
                                                                    </Toggle>
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
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </div>
        </div>
    );
}