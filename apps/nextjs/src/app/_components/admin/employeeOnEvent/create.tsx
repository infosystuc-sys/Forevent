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
import { DataTableColumnHeader } from '../../table/column-header'
import { DataTablePagination } from '../../table/pagination'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Icons } from '../../ui/icons'

const employeesColumns: ColumnDef<ArrayElement<RouterOutputs["web"]["event"]["employeesNotOnEvent"]>>[] = [
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
function CreateEmployeeOnEvent({ initialEmployeesNotOnEvent, initialGates, initialCounter, eventId }: { initialEmployeesNotOnEvent: RouterOutputs['web']['event']['employeesNotOnEvent'], initialGates: RouterOutputs['web']['event']['gates'], initialCounter: RouterOutputs['web']['event']['counters'], eventId: string }) {
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([])
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

    const employeesNotOnEvent = api.web.event.employeesNotOnEvent.useQuery({ eventId }, {
        initialData: initialEmployeesNotOnEvent
    })

    const counters = api.web.event.counters.useQuery({ eventId }, {
        initialData: initialCounter
    })

    const gates = api.web.event.gates.useQuery({ eventId }, {
        initialData: initialGates
    })

    const create = api.web.employeeOnEvent.create.useMutation({
        onSuccess: async () => {
            await utils.web.employeeOnEvent.byId.invalidate()
            toast("Exito", {
                description: "Empleados asignados exitosamente",
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

    const employeeTable = useReactTable({
        data: employeesNotOnEvent.data,
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
        const selectedEmployees = employeeTable.getSelectedRowModel().rows.map(row => row.original.id)
        if (!gate && !counter) {
            toast("Error", {
                description: 'Tiene q asignar una puerta o mostrador',
                action: {
                    label: "Cerrar", onClick: () => {
                        // console.log("close!")
                    }
                }
            })
        } else if (selectedEmployees.length === 0) {
            toast("Error", {
                description: 'Debe seleccionar almenos un empleado',
                action: {
                    label: "Cerrar", onClick: () => {
                        // console.log("close!")
                    }
                }
            })
        } else {
            create.mutate({
                employeesIds: employeeTable.getSelectedRowModel().rows.map(row => row.original.id),
                counterId: counter,
                gateId: gate,
                eventId
            })
        }
    }
    console.log(employeesNotOnEvent.isLoading || gates.isLoading || counters.isLoading, 'IsLoading')
    if (employeesNotOnEvent.isLoading || gates.isLoading || counters.isLoading) {
        return <p><Icons.spinner className=" h-5 w-5 animate-spin" /></p>
    }

    return (
        <div className={`flex w-full gap-5`}>
            <Card className="flex-1">
                <CardHeader className="mb-0 pb-2">
                    <CardTitle>
                        Asignar empleados
                    </CardTitle>
                    <CardDescription className="max-w-3xl">
                        Asigna empleados al evento
                    </CardDescription>
                </CardHeader>
                <CardContent className={`flex-col flex-1 gap-10`}>
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
                    <Button disabled={create.isPending} variant={"outline"} type="button" onClick={() => onSubmit()}>
                        Crear
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

export default CreateEmployeeOnEvent