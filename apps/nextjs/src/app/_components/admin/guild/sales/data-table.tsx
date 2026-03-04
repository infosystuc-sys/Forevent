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
import Link from 'next/link'
import { buttonVariants } from '~/app/_components/ui/button'

const columns: ColumnDef<ArrayElement<RouterOutputs["web"]["guild"]["getGuildSales"]["eventsTotals"]>>[] = [
    {
        accessorKey: "eventId",
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
        header: "Nombre del evento",
        cell: ({ row }) => {
            return (
                <p>{row.original.name}</p>
            )
        }
    },
    {
        id: "total",
        accessorKey: "total",
        header: "Ganancias por evento"
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <div>
                    <Link href={`events/${row.original.eventId}/sales`} className={buttonVariants({ variant: "outline" })}>
                        Ver ventas de evento
                    </Link>
                </div>
            )
        },
    },
]

export function DataTable({
    data,
}: { data: RouterOutputs["web"]["guild"]["getGuildSales"] }) {
    const [filtering, setFiltering] = React.useState('')
    const params = useParams()

    const eventSales = api.web.guild.getGuildSales.useQuery({
        guildId: params?.guildId! as string
    }, {
        initialData: data,
    })

    const table = useReactTable({
        data: eventSales.data.eventsTotals,
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
