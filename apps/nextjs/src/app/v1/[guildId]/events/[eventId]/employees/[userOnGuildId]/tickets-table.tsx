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
import { Info, Ticket } from 'lucide-react'
import { useParams } from 'next/navigation'
import { DataTablePagination } from '~/app/_components/table/pagination'
import { Button } from '~/app/_components/ui/button'
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/app/_components/ui/tooltip"
import { api } from "~/trpc/react"


const columns: ColumnDef<ArrayElement<RouterOutputs["web"]["employeeOnEvent"]["scans"]["tickets"]>>[] = [
    {
        accessorKey: "ticket",
        header: "ticket",
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-2">
                    <p>{row?.original?.ticket.name ?? ""}</p>
                    {
                        row?.original?.ticket.about && (
                            <Tooltip delayDuration={350}>
                                <TooltipTrigger asChild >
                                    <Button variant="ghost" size="icon">
                                        <Info />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="flex justify-center items-center gap-3 my-3">
                                        <div className="h-14 w-14 flex items-center justify-center bg-secondary rounded-full">
                                            <Ticket />
                                        </div>
                                        <div>
                                            <p>$ {row.original.ticket.price}</p>
                                            <p>{row?.original.ticket.about}</p>
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )
                    }
                </div>
            )
        },
    },
    {
        accessorKey: "owner",
        header: "Canjeado a",
        cell: ({ row }) => {
            return (
                <p>
                    {row.original.owner.name}
                </p>
            )
        },
    }
]

export function TicketsTable({
    data,
}: { data: RouterOutputs["web"]["employeeOnEvent"]["scans"] }) {
    const [filtering, setFiltering] = React.useState('')
    const params = useParams()

    const getEmployeeScans = api.web.employeeOnEvent.scans.useQuery({
        eventId: params?.eventId! as string,
        userOnGuildId: params?.userOnGuildId! as string
    }, {
        initialData: data,
    })

    const table = useReactTable({
        data: getEmployeeScans.data.tickets,
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
