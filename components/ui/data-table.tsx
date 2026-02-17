"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
    VisibilityState,
    Table,
    FilterFn,
} from "@tanstack/react-table"
import Fuse from "fuse.js"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.original, value)

    // Store the itemRank info
    addMeta({
        itemRank,
    })

    // Return if the item should be filtered in/out
    return itemRank.passed
}

// Simple Fuse wrapper for ranking
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rankItem(item: any, value: string) {
    if (!value) return { passed: true, score: 0 };

    const options = {
        includeScore: true,
        threshold: 0.3,
        keys: [
            "description",
            "categoryName",
            "accountName",
            "amount",
            "tags"
        ]
    }

    const fuse = new Fuse([item], options)
    const result = fuse.search(value)

    return {
        passed: result.length > 0,
        score: result.length > 0 ? result[0]?.score : 1
    }
}

import {
    Table as ShadcnTable, // Renamed to avoid conflict with @tanstack/react-table's Table type
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string
    toolbar?: (table: Table<TData>) => React.ReactNode
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    toolbar,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [globalFilter, setGlobalFilter] = React.useState("")

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: (updater) => {
            if (typeof updater === 'function') {
                setColumnFilters(updater(columnFilters))
            } else {
                setColumnFilters(updater)
            }
        },
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: (updater) => {
            if (typeof updater === 'function') {
                setColumnVisibility(updater(columnVisibility))
            } else {
                setColumnVisibility(updater)
            }
        },
        onRowSelectionChange: (updater) => {
            if (typeof updater === 'function') {
                setRowSelection(updater(rowSelection))
            } else {
                setRowSelection(updater)
            }
        },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
    })

    return (
        <div className="space-y-4">
            {toolbar ? toolbar(table) : (
                <div className="flex items-center py-4">
                    <Input
                        placeholder={`Filter ${searchKey}...`}
                        value={(table.getColumn(searchKey || "")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn(searchKey || "")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                </div>
            )}

            <div className="rounded-md border">
                <ShadcnTable>
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
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </ShadcnTable>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
