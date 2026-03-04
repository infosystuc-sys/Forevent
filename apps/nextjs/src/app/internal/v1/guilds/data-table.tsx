"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable
} from '@tanstack/react-table'
import * as React from "react"

import type { ArrayElement, RouterOutputs } from '@forevent/api'
import { usePathname, useRouter } from 'next/navigation'
import { DataTablePagination } from '~/app/_components/table/pagination'
import { DataTableToolbar } from "~/app/_components/table/toolbar"
import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/ui/avatar"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/app/_components/ui/table"
import { customdayjs } from '~/lib/constants'
import { api } from '~/trpc/react'

const columns: ColumnDef<ArrayElement<RouterOutputs["web"]["internal"]["allGuilds"]>>[] = [
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
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => {
            return (
                <p>{row.original.name}</p>
            )
        }
    },
    {
        accessorKey: "address",
        header: "Descripción",
        cell: ({ row }) => {
            return (
                <p>{row.original.address ?? ""}</p>
            )
        }
    },
    {
        accessorKey: "email",
        header: "Correo",
        cell: ({ row }) => {
            return (
                <p>
                    {row.original.email}
                </p>
            )
        }
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            return (
                <p>{row.original.status}</p>
            )
        }
    },
    {
        accessorKey: "discharged",
        header: "Alta",
        cell: ({ row }) => {
            return (
                <p>{row.original.discharged ? "Si" : "No"}</p>
            )
        }
    },
    {
        accessorKey: "tickets",
        header: "Tickets",
        cell: ({ row }) => {
            return (
                <p>{customdayjs(row.original.createdAt).format("DD/MM/YYYY")}</p>
            )
        }
    },
]

export function DataTable({ data }: { data: RouterOutputs["web"]["internal"]["allGuilds"] }) {
    const [filtering, setFiltering] = React.useState('')
    const path = usePathname()
    const router = useRouter()

    const getEvents = api.web.internal.allGuilds.useQuery(undefined, {
        initialData: data,
    })

    const table = useReactTable({
        data: getEvents.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter: filtering,
        },
        onGlobalFilterChange: setFiltering,
    })


    return (
        <div className="space-y-4">
            <div className="flex items-center pt-4">
                <DataTableToolbar table={table} />
            </div >
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
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
                    <TableBody>
                        {table.getRowModel().rows?.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={() => {
                                        // console.log(path, "PATH")
                                        router.push(`${path}/${row.original.id}`)
                                        console.log(row, "ROW")
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No se encontraron resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className='px-5'>
                <DataTablePagination table={table} />
            </div>
        </div >
    )
}
