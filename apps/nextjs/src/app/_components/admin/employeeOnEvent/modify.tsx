'use client'
import type { ArrayElement, RouterOutputs } from '@forevent/api'
import { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/app/_components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/app/_components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/app/_components/ui/table'
import { api } from '~/trpc/react'
import Return from '../../return'
import { DataTableColumnHeader } from '../../table/column-header'
import { DataTablePagination } from '../../table/pagination'
import { Icons } from '../../ui/icons'

const gatesColumns: ColumnDef<ArrayElement<RouterOutputs["web"]["event"]["gates"]>>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Puerta" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex space-x-2">
                    <span className="max-w-[500px] truncate font-medium">
                        {row.original.name}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "about",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Descripción" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex space-x-2">
                    <span className="max-w-[500px] truncate font-medium">
                        {row.original.about}
                    </span>
                </div>
            )
        },
    },
]

const countersColumns: ColumnDef<ArrayElement<RouterOutputs["web"]["event"]["counters"]>>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Mostrador" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex space-x-2">
                    <span className="max-w-[500px] truncate font-medium">
                        {row.original.name}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "about",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Descripción" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex space-x-2">
                    <span className="max-w-[500px] truncate font-medium">
                        {row.original.about}
                    </span>
                </div>
            )
        },
    },
]
// poner lasquerys de la puertas y las barras
function ModifyEmployeeOnEvent({
    employeeOnEvent,
    userOnGuildId: userOnGuildId,
    initialGates,
    initialCounter,
    eventId
}: {
    employeeOnEvent: RouterOutputs['web']['employeeOnEvent']['byId'],
    userOnGuildId: string, initialGates: RouterOutputs['web']['event']['gates'],
    initialCounter: RouterOutputs['web']['event']['counters'],
    eventId: string
}) {
    const [rowSelectionC, setRowSelectionC] = useState({})
    const [columnVisibilityC, setColumnVisibilityC] = useState<VisibilityState>({})
    const [columnFiltersC, setColumnFiltersC] = useState<ColumnFiltersState>([])
    const [sortingC, setSortingC] = useState<SortingState>([])
    const [rowSelectionG, setRowSelectionG] = useState({})
    const [columnVisibilityG, setColumnVisibilityG] = useState<VisibilityState>({})
    const [columnFiltersG, setColumnFiltersG] = useState<ColumnFiltersState>([])
    const [sortingG, setSortingG] = useState<SortingState>([])
    const utils = api.useUtils()
    const router = useRouter()

    const employee = api.web.employeeOnEvent.byId.useQuery({ id: userOnGuildId }, {
        initialData: employeeOnEvent
    })

    const counters = api.web.event.counters.useQuery({ eventId }, {
        initialData: initialCounter
    })

    const gates = api.web.event.gates.useQuery({ eventId }, {
        initialData: initialGates
    })

    const modify = api.web.employeeOnEvent.modifyEmployee.useMutation({
        onSuccess: async () => {
            await utils.web.employeeOnEvent.byId.invalidate()
            await utils.web.employeeOnEvent.all.invalidate()
            toast("Exito", {
                description: "Empleado modificado exitosamente",
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

    const countersTable = useReactTable({
        data: counters.data,
        columns: countersColumns,
        state: {
            sorting: sortingC,
            columnVisibility: columnVisibilityC,
            rowSelection: rowSelectionC,
            columnFilters: columnFiltersC,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelectionC,
        onSortingChange: setSortingC,
        onColumnFiltersChange: setColumnFiltersC,
        onColumnVisibilityChange: setColumnVisibilityC,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    const gatesTable = useReactTable({
        data: gates.data,
        columns: gatesColumns,
        state: {
            sorting: sortingG,
            columnVisibility: columnVisibilityG,
            rowSelection: rowSelectionG,
            columnFilters: columnFiltersG,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelectionG,
        onSortingChange: setSortingG,
        onColumnFiltersChange: setColumnFiltersG,
        onColumnVisibilityChange: setColumnVisibilityG,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    const onSubmit = () => {
        const gate = gatesTable.getSelectedRowModel().rows.map(row => row.original.id).length > 0 ? gatesTable.getSelectedRowModel().rows.map(row => row.original.id)[0] : undefined
        const counter = countersTable.getSelectedRowModel().rows.map(row => row.original.id).length > 0 ? countersTable.getSelectedRowModel().rows.map(row => row.original.id)[0] : undefined
        modify.mutate({
            eventId: eventId,
            userOnGuildId: userOnGuildId,
            counterId: counter,
            gateId: gate
        })
    }

    if (employee.isLoading || gates.isLoading || counters.isLoading) {
        return <p><Icons.spinner className=" h-5 w-5 animate-spin" /></p>
    }

    if (employee.isError || gates.isError || counters.isError) {
        return <p>{(employee.error?.message)}<br /> {(gates.error?.message)} <br /> {(counters.error?.message)}</p>
    }

    return (
        <div className="flex flex-1 items-center justify-center">
            <div className="max-w-7xl w-full">
                <Return />
                <div className="flex flex-1 justify-between items-start">
                    <Card className="flex-1">
                        <CardHeader className="mb-0 pb-2">
                            <CardTitle>
                                {employee.data?.userOnGuild?.user.name}
                            </CardTitle>
                            <CardDescription className="max-w-3xl">
                                Asignaciones del empleado en el evento
                            </CardDescription>
                        </CardHeader>
                        <CardContent className={`flex flex-col flex-1 gap-5`}>
                            <div className=''>
                                <div className='flex gap-2'>
                                    <h4>Mostrador asignado: </h4>
                                    <p>{employee.data?.counter?.name ?? 'Ninguno'}</p>
                                </div>
                                <div className='flex gap-2'>
                                    <h4>Puerta asignada:</h4>
                                    <p>{employee.data?.gate?.name ?? 'Ninguna'}</p>
                                </div>
                            </div>
                            <div className='flex space-x-5'>
                                <div className='flex flex-1 justify-center items-center w-full'>
                                    <div className={`w-full space-y-5`}>
                                        <Card className="bg-background">
                                            <CardContent className='space-y-5 p-0 w-full'>
                                                <Table className='w-full'>
                                                    <TableHeader className='w-full'>
                                                        {countersTable.getHeaderGroups().map((headerGroup) => (
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
                                                        {countersTable.getRowModel().rows?.length ? (
                                                            countersTable.getRowModel().rows.map((row) => (
                                                                <TableRow
                                                                    className={`w-full ${row.getIsSelected() ? "bg-zinc-800" : ""}`}
                                                                    key={row.id}
                                                                    data-state={row.getIsSelected() && "selected"}
                                                                    onClick={() => {
                                                                        const selected = !row.getIsSelected()
                                                                        countersTable.resetRowSelection()
                                                                        row.toggleSelected(selected)
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
                                                                    colSpan={countersColumns.length}
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
                                            <DataTablePagination table={countersTable} />
                                        </div>
                                    </div>
                                </div>
                                <div className='flex flex-1 justify-center items-center w-full'>
                                    <div className={`w-full space-y-5`}>
                                        <Card className="bg-background">
                                            <CardContent className='space-y-5 p-0 w-full'>
                                                <Table className='w-full'>
                                                    <TableHeader className='w-full'>
                                                        {gatesTable.getHeaderGroups().map((headerGroup) => (
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
                                                        {gatesTable.getRowModel().rows?.length ? (
                                                            gatesTable.getRowModel().rows.map((row) => (
                                                                <TableRow
                                                                    className={`w-full ${row.getIsSelected() ? "bg-zinc-800" : ""}`}
                                                                    key={row.id}
                                                                    data-state={row.getIsSelected() && "selected"}
                                                                    onClick={() => {
                                                                        const selected = !row.getIsSelected()
                                                                        gatesTable.resetRowSelection()
                                                                        row.toggleSelected(selected)
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
                                                                    colSpan={gatesColumns.length}
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
                                            <DataTablePagination table={gatesTable} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex items-center justify-center">
                            <Button disabled={modify.isPending} variant={"outline"} type="button" onClick={() => onSubmit()}>
                                {modify.isPending ?
                                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                    :
                                    "Modificar"
                                }
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default ModifyEmployeeOnEvent