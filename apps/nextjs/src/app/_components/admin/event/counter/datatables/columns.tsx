"use client"

import type { ArrayElement, RouterOutputs } from "@forevent/api"
import { ColumnDef } from "@tanstack/react-table"
import { Ticket } from "lucide-react"
import { buttonVariants } from "~/app/_components/ui/button"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/ui/avatar"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.


export const ProductsColumns: ColumnDef<ArrayElement<RouterOutputs["web"]["purchase"]["total"]["totalProducts"]>>[] = [
    {
        accessorKey: "image",
        header: "",
        cell: ({ row }) => {
            return (
                <div className="w-min">
                    <Avatar className="h-14 w-14">
                        <AvatarImage
                            src={row.original.image}
                            alt={"image"}
                        />
                        <AvatarFallback className="text-lg bg-neutral-900">{row.original.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>
            )
        },
    },
    {
        accessorKey: "name",
        header: "Producto",
    },
    {
        accessorKey: "price",
        header: "Precio",
    },
    {
        accessorKey: "unitsAvailable",
        header: "Disponibles",
    },
    {
        accessorKey: "unitsSold",
        header: "Vendidos",
    },
    {
        accessorKey: "total",
        header: "Total",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <div>
                    <Link href={`sales/products/${row.original.productId}`} className={buttonVariants({ variant: "outline" })}>
                        Ver canjes
                    </Link>
                </div>
            )
        },
    },
]

export const TicketsColumns: ColumnDef<ArrayElement<RouterOutputs["web"]["purchase"]["total"]["totalTickets"]>>[] = [
    {
        accessorKey: "image",
        header: "",
        cell: ({ row }) => {
            return (
                <div className="h-14 w-14 flex items-center justify-center bg-secondary rounded-full">
                    <Ticket />
                </div>
            )
        },
    },
    {
        accessorKey: "name",
        header: "Ticket",
    },
    {
        accessorKey: "price",
        header: "Precio",
    },
    {
        accessorKey: "unitsAvailable",
        header: "Disponibles",
    },
    {
        accessorKey: "unitsSold",
        header: "Vendidos",
    },
    {
        accessorKey: "total",
        header: "Total",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <div>
                    <Link href={`sales/tickets/${row.original.ticketId}`} className={buttonVariants({ variant: "outline" })}>
                        Ver canjes
                    </Link>
                </div>
            )
        },
    },
]

export const DealsColumns: ColumnDef<ArrayElement<RouterOutputs["web"]["purchase"]["total"]["totalDeals"]>>[] = [
    {
        accessorKey: "image",
        header: "",
        cell: ({ row }) => {
            return (
                <div className="w-min">
                    <Avatar className="h-14 w-14">
                        <AvatarImage
                            src={row.original.image}
                            alt={"image"}
                        />
                        <AvatarFallback className="text-lg bg-neutral-900">{row.original.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>
            )
        },
    },
    {
        accessorKey: "name",
        header: "Promoción",
    },
    {
        accessorKey: "price",
        header: "Precio",
    },
    {
        accessorKey: "unitsSold",
        header: "Vendidos",
    },
    {
        accessorKey: "total",
        header: "Total",
    },
    // {
    //     id: "actions",
    //     cell: ({ row }) => {
    //         return (
    //             <div>
    //                 <Link href={`sales/deals/${row.original.dealId}`} className={buttonVariants({ variant: "outline" })}>
    //                     Ver canjes
    //                 </Link>
    //             </div>
    //         )
    //     },
    // },
]

export const ProductsExchangesColumns: ColumnDef<ArrayElement<RouterOutputs["web"]["userPurchase"]["exchanges"]>>[] = [
    {
        accessorKey: "owner",
        header: "Consumidor",
        cell: ({ row }) => {
            return (
                <p>
                    {row.original.owner?.name}
                </p>
            )
        },
    },
    {
        accessorKey: "cashier",
        header: "Cajero",
        cell: ({ row }) => {
            return (
                <p>
                    {row.original.cashier?.user.name}
                </p>
            )
        },
    },
    {
        accessorKey: "counter",
        header: "Barra",
        cell: ({ row }) => {
            return (
                <p>
                    {row.original.counter?.name}
                </p>
            )
        },
    },
    {
        accessorKey: "counter",
        header: "Depósito",
        cell: ({ row }) => {
            return (
                <p>
                    {row.original.counter?.deposit.name}
                </p>
            )
        },
    },
]
