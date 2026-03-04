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
import { buttonVariants } from '@forevent/ui/button'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DataTablePagination } from '~/app/_components/table/pagination'
import { Button } from '~/app/_components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/app/_components/ui/dialog'
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

const columns: ColumnDef<ArrayElement<Awaited<RouterOutputs["web"]["event"]["deposits"]>>>[] = [
    {
        accessorKey: "id",
        header: "",
        cell: () => <></>
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
        accessorKey: "about",
        header: "Descripción",
        cell: ({ row }) => {
            return (
                <p>{row.original.about}</p>
            )
        }
    },
    {
        accessorKey: "productsOnDeposit",
        header: "Productos",
        cell: ({ row }) => {
            return (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline">Productos {`(${row.original.productsOnDeposit.length})`}</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{row.original.name}</DialogTitle>
                            <DialogDescription>
                                Estos son los productos de {row.original.name}
                            </DialogDescription>
                        </DialogHeader>
                        {row.original.productsOnDeposit.map((prod, index) => {
                            return (
                                <div className="pb-4" key={index.toString()}>
                                    <div className='flex flex-1 justify-between items-center gap-2'>
                                        <div className='space-y-1'>
                                            <h1 className="font-bold">{prod.product.name}</h1>
                                        </div>
                                        <div className='flex flex-1 gap-1 items-center justify-end'>
                                            <p>{prod.quantity}</p>
                                            <p>ud</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <DialogFooter>
                            <DialogClose>
                                <Button type="button">Cerrar</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )
        }
    },
    {
        id: 'asignar',
        header: "",
        cell: ({ row }) => {
            return (
                <Link className={buttonVariants({ variant: 'outline' })} href={`deposits/${row.original.id}`}>
                    Agregar productos
                </Link>
            )
        }
    },
]

export function DataTable({
    data,
}: { data: Awaited<RouterOutputs["web"]["event"]["deposits"]> }) {
    const [filtering, setFiltering] = React.useState('')
    const params = useParams()

    const products = api.web.event.deposits.useQuery({
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
