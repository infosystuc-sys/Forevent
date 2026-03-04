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
import { useParams } from 'next/navigation'
import { DataTablePagination } from '~/app/_components/table/pagination'
import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/ui/avatar"
import { Input } from "~/app/_components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/app/_components/ui/table"
import {
    TooltipProvider
} from "~/app/_components/ui/tooltip"
import { api } from "~/trpc/react"

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

export function DataTable({
    data,
}: { data: Awaited<RouterOutputs["web"]["event"]["products"]> }) {
    const [filtering, setFiltering] = React.useState('')
    const params = useParams()

    const products = api.web.event.products.useQuery({
        eventId: params?.eventId! as string
    }, {
        initialData: data,
    })

    const table = useReactTable({
        data: products.data,
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
                <div>
                    <Input
                        type='text'
                        placeholder="Buscar..."
                        value={(table.getColumn("name")?.getFilterValue()! as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className='w-96'
                    />
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TooltipProvider>

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
                                            // router.push(`${path}/${row.getValue("id")}`)
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
                    </TooltipProvider>
                </Table>
            </div>
            <div className='px-5'>
                <DataTablePagination table={table} />
            </div>

        </div >
    )
}
