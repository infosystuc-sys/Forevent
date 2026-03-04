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
import { Input } from "~/app/_components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/app/_components/ui/table"
import { api } from "~/trpc/react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/app/_components/ui/tooltip"
import { Button } from '~/app/_components/ui/button'
import { Info } from 'lucide-react'

const columns: ColumnDef<ArrayElement<RouterOutputs["web"]["userPurchase"]["exchanges"]>>[] = [
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
    {
        accessorKey: "deal",
        header: "Promoción",
        cell: ({ row }) => {

            if (!row.original.deal) {
                return (
                    <p className="text-neutral-500">Este canje no forma parte de una promoción</p>
                )
            }

            return (
                <div className="flex items-center gap-2">
                    <p>{row?.original?.deal?.name ?? ""}</p>
                    {
                        row?.original?.deal?.about && (
                            <Tooltip delayDuration={350}>
                                <TooltipTrigger asChild >
                                    <Button variant="ghost" size="icon">
                                        <Info />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{row?.original.deal?.about}</p>
                                </TooltipContent>
                            </Tooltip>
                        )
                    }
                </div>
            )
        },
    }
]

export function DataTable({
    data,
}: { data: RouterOutputs["web"]["userPurchase"]["exchanges"] }) {
    const [filtering, setFiltering] = React.useState('')
    const params = useParams()

    const getEmployeesOnEvent = api.web.userPurchase.exchanges.useQuery({
        eventId: params?.eventId! as string,
        productId: params?.productId! as string
    }, {
        initialData: data,
    })

    const table = useReactTable({
        data: getEmployeesOnEvent.data,
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
                                            <TooltipProvider>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TooltipProvider>
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
