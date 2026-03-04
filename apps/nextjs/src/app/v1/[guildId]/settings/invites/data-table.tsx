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
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { DataTablePagination } from "~/app/_components/table/pagination"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/app/_components/ui/alert-dialog"
import { Button } from "~/app/_components/ui/button"
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

export function DataTable({
    data
}: { data: Awaited<RouterOutputs["web"]["userOnGuild"]["getGuildInvites"]> }) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const params = useParams()
    const utils = api.useUtils()

    const modifyInvitation = api.web.userOnGuild.modifyInvite.useMutation({
        onSuccess: async () => {
            await utils.web.userOnGuild.getGuildInvites.invalidate()
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape, "error")
            toast("Ocurrio un error", {
                description: error.message,
                action: {
                    label: "Cerrar", onClick: () => {
                        // console.log("close!")
                    }
                }
            })
        }
    })

    const getGuildInvites = api.web.userOnGuild.getGuildInvites.useQuery({
        guildId: params?.guildId! as string,
    }, {
        initialData: data,
    })

    const columns: ColumnDef<ArrayElement<Awaited<RouterOutputs["web"]["userOnGuild"]["getGuildInvites"]>>>[] = [
        {
            accessorKey: "id",
            header: "",
            cell: () => <></>
        },
        {
            accessorKey: "user",
            header: "Nombre",
            cell: ({ row }) => <div>{row.original.user.name}</div>
        },
        {
            accessorKey: "userId",
            header: "Correo electrónico",
            cell: ({ row }) => <div>{row.original.user.email}</div>
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => {
                let status
                switch (row.original.status) {
                    case "ACCEPTED":
                        status = 'ACEPTADO'
                        break;
                    case "PENDING":
                        status = 'PENDIENTE'
                        break;
                    case "CANCELLED":
                        status = 'CANCELADO'
                        break;
                    case "REJECTED":
                        status = 'RECHAZADO'
                        break;
                }
                return (
                    <div>
                        {status}
                    </div>
                )
            }
        },
        {
            accessorKey: "status",
            header: "",
            cell: ({ row }) => {
                if (row.original.status !== 'PENDING') {
                    return
                }
                return (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant={"destructive"}>
                                Cancelar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Quieres cancelar la invitación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Podrás invitar de nuevo al empleado
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cerrar</AlertDialogCancel>
                                <Button type='button' variant={'destructive'} onClick={() => {
                                    console.log("delete")
                                    modifyInvitation.mutate({ inviteId: row.original.id, action: 'discharge' })
                                }}>Cancelar invitación</Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )
            }
        },
    ]

    const table = useReactTable({
        data: getGuildInvites.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        initialState: {
            pagination: { pageSize: 10, pageIndex: 0 }
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center pt-4">
                <Input
                    placeholder="Buscar..."
                    value={(table.getColumn("user")?.getFilterValue()! as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("user")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup, index) => (
                            <TableRow key={`${headerGroup.id}${index}`}>
                                {headerGroup.headers.map((header, index) => {
                                    return (
                                        <TableHead key={`${header.id}${index}`}>
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
                            table.getRowModel().rows.map((row, index) => (
                                <TableRow
                                    key={`${row.id}${index}`}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell, index) => (
                                        <TableCell key={`${cell.id}${index}`}>
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
