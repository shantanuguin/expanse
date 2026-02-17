"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Expense } from "@/types"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import { Badge } from "@/components/ui/badge"
import { DataTableRowActions } from "./data-table-row-actions"

// Helper to safely get date
const getDate = (date: unknown): Date => {
    if (!date) return new Date();
    if (typeof date === 'object' && date !== null && 'toDate' in date) {
        return (date as { toDate: () => Date }).toDate();
    }
    return new Date(date as string | number | Date);
};

export const columns: ColumnDef<Expense>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "date",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = getDate(row.getValue("date"));
            return <div>{format(date, "MMM d, yyyy")}</div>
        },
    },
    {
        accessorKey: "description",
        header: "Description",
    },
    {
        accessorKey: "categoryName",
        header: "Category",
        cell: ({ row }) => {
            return <Badge variant="secondary">{row.getValue("categoryName")}</Badge>
        }
    },
    {
        accessorKey: "accountName",
        header: "Account",
    },
    {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => {
            const tags = row.original.tags || [];
            if (!tags.length) return null;
            return (
                <div className="flex flex-wrap gap-1">
                    {tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs font-normal">
                            {tag}
                        </Badge>
                    ))}
                </div>
            );
        },
        filterFn: (row, id, value) => {
            const rowTags = (row.getValue(id) as string[]) || [];
            // value is array of selected tags from filter
            if (!value || value.length === 0) return true;
            return value.some((val: string) => rowTags.includes(val));
        },
    },
    {
        accessorKey: "amount",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="justify-end w-full"
                >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: row.original.currency || "USD",
            }).format(amount)

            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => <DataTableRowActions row={row} />,
    },
]
