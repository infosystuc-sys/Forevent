"use client"

import type {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState
} from "@tanstack/react-table"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import * as React from "react"

import type { ArrayElement, RouterOutputs } from "@forevent/api"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { DataTablePagination } from "~/app/_components/table/pagination"
import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/ui/avatar"
import { buttonVariants } from "~/app/_components/ui/button"
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

type Search = 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'PENDING' | 'PAST' | undefined
const searchStrings = ['ACCEPTED', 'REJECTED', 'CANCELLED', 'PENDING', 'PAST']

const columns: ColumnDef<ArrayElement<Awaited<RouterOutputs["web"]["event"]["byGuildId"]>>>[] = [
    {
        accessorKey: "image",
        header: " ",
        cell: ({ row }) => (
            <div className="w-min">
                <Avatar className="h-14 w-14">
                    <AvatarImage
                        src={row.original?.image ?? ""}
                        alt={"image"}
                        className="object-cover"
                    />
                    <AvatarFallback className="text-lg bg-neutral-900">{row?.original?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
            </div>
        )
    },
    // {
    //     accessorKey: "image",
    //     header: "",
    //     cell: ({ row }) => {
    //         return (
    //             <div className="w-min">
    //                 <Avatar className="h-14 w-14">
    //                     <AvatarImage
    //                         src={row.original?.image ?? ""}
    //                         alt={"image"}
    //                     />
    //                     <AvatarFallback className="text-lg bg-neutral-900">{row?.original?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
    //                 </Avatar>
    //             </div>
    //         )
    //     },
    // },
    {
        accessorKey: "name",
        header: "Nombre",
    },
    {
        accessorKey: "private",
        header: "Acceso",
        cell: ({ row }) => row.original.private ? <p className="text-yellow-500">Privado</p> : <p>Público</p>
    },
    {
        accessorKey: "location",
        header: "Ubicación",
        cell: ({ row }) => <p>{row.original.location.address}, {row.original.location.city}, {row.original.location.country}</p>
    },
    {
        accessorKey: "status",
        header: "Estado del evento",
        cell: ({ row }) => {
            const status = {
                ACCEPTED: ['text-green-500', 'Aceptado'],
                REJECTED: ['text-red-500', 'Rechazado'],
                CANCELLED: ['text-orange-500', 'Cancelado'],
                PENDING: ['text-yellow-500', 'Pendiente']
            }
            return (
                <p className={status[row.original.status][0]}>
                    {status[row.original.status][1]}
                </p>
            )
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <>
                    {/*<Actions original={row.original} /> */}
                    <Link href={`/v1/${row.original.guildId}/events/${row.original.id}`} className={buttonVariants({ variant: "outline" })}>
                        Ver Evento
                    </Link>
                </>
            )
        },
    },
]

export function DataTable({ data }: { data: Awaited<RouterOutputs["web"]["event"]["byGuildId"]> }) {
    const searchParams = useSearchParams().get('q')
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const params = useParams()

    const getLocations = api.web.event.byGuildId.useQuery({
        guildId: params?.guildId! as string,
        q: searchParams && searchStrings.includes(searchParams) ? searchParams as Search : undefined
    }, {
        initialData: data,
    })

    const table = useReactTable({
        data: getLocations.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        initialState: { pagination: { pageSize: 10, pageIndex: 0 } },
        state: { sorting, columnFilters, columnVisibility, rowSelection },
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center pt-4">
                <Input
                    placeholder="Buscar..."
                    value={(table.getColumn("name")?.getFilterValue()! as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
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
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                // onClick={() => router.push(`${row.getValue("id")}`)}
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
