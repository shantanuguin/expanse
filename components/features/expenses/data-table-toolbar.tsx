"use client"

import { Table } from "@tanstack/react-table"
import { X, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { deleteDocument } from "@/lib/firestore-service"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Category, Account } from "@/types"
import { DateRange } from "react-day-picker"
import { useEffect } from "react"

interface DataTableToolbarProps<TData> {
    table: Table<TData>
    categories: Category[]
    accounts: Account[]
}

export function DataTableToolbar<TData>({
    table,
    categories,
    accounts,
}: DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0

    const categoryOptions = categories.map(c => ({
        label: c.name,
        value: c.name, // We are filtering by categoryName which is a string in the row
    }));

    const accountOptions = accounts.map(a => ({
        label: a.name,
        value: a.name,
    }));

    // Start of calculating unique tags
    const uniqueTags = Array.from(
        new Set(
            table.getPreFilteredRowModel().rows.flatMap((row) => (row.getValue("tags") as string[]) || [])
        )
    ).sort().map(tag => ({
        label: tag,
        value: tag,
    }));
    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                // Focus search logic or open command palette
                // Since user has no command palette, maybe focus the search input?
                // Or just adding a basic shortcut listener for future.
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center space-x-2">
                    <Input
                        placeholder="Search all columns..."
                        value={(table.getState().globalFilter as string) ?? ""}
                        onChange={(event) =>
                            table.setGlobalFilter(event.target.value)
                        }
                        className="h-8 w-[150px] lg:w-[250px]"
                    />
                    {table.getColumn("date") && (
                        <DatePickerWithRange
                            date={(table.getColumn("date")?.getFilterValue() as DateRange) || undefined}
                            setDate={(date) => table.getColumn("date")?.setFilterValue(date)}
                        />
                    )}
                    {table.getColumn("categoryName") && (
                        <DataTableFacetedFilter
                            column={table.getColumn("categoryName")}
                            title="Category"
                            options={categoryOptions}
                        />
                    )}
                    {table.getColumn("accountName") && (
                        <DataTableFacetedFilter
                            column={table.getColumn("accountName")}
                            title="Account"
                            options={accountOptions}
                        />
                    )}
                    {table.getColumn("tags") && uniqueTags.length > 0 && (
                        <DataTableFacetedFilter
                            column={table.getColumn("tags")}
                            title="Tags"
                            options={uniqueTags}
                        />
                    )}
                    {isFiltered && (
                        <Button
                            variant="ghost"
                            onClick={() => table.resetColumnFilters()}
                            className="h-8 px-2 lg:px-3"
                        >
                            Reset
                            <X className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
                {table.getFilteredSelectedRowModel().rows.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground hidden lg:inline-block">
                            {table.getFilteredSelectedRowModel().rows.length} selected
                        </span>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-8"
                            onClick={async () => {
                                const selectedRows = table.getFilteredSelectedRowModel().rows;
                                if (!confirm(`Are you sure you want to delete ${selectedRows.length} items?`)) return;

                                try {
                                    // Use explicit cast if TData is unknown
                                    const ids = selectedRows.map(r => (r.original as { id: string }).id);
                                    await Promise.all(ids.map(id => deleteDocument("expenses", id)));
                                    toast.success(`Deleted ${ids.length} items`);
                                    table.resetRowSelection();
                                } catch (error) {
                                    toast.error("Failed to delete selected items");
                                    console.error(error);
                                }
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
