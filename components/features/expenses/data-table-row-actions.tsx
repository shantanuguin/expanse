"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Pen, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Expense } from "@/types";
import { deleteDocument, addDocument, expensesCollection } from "@/lib/firestore-service";
import { toast } from "sonner";

interface DataTableRowActionsProps<TData> {
    row: Row<TData>;
}

export function DataTableRowActions<TData>({
    row,
}: DataTableRowActionsProps<TData>) {
    const expense = row.original as Expense;

    const handleDelete = async () => {
        try {
            await deleteDocument("expenses", expense.id);
            toast("Expense deleted", {
                action: {
                    label: "Undo",
                    onClick: async () => {
                        // Restore logic
                        // We use a new ID for simplicity, or we could strict restore
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { id, createdAt, updatedAt, ...dataToRestore } = expense;
                        await addDocument(expensesCollection, {
                            ...dataToRestore,
                        }, expense.userId);
                        toast.success("Expense restored");
                    },
                },
            });
        } catch (error) {
            toast.error("Failed to delete expense");
            console.error(error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => console.log("Edit", expense.id)}>
                    <Pen className="mr-2 h-3.5 w-3.5" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                    <Trash className="mr-2 h-3.5 w-3.5" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
