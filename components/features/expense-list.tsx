"use client";

import { useCollection } from "@/hooks/use-firestore";
import { Expense, Category, Account } from "@/types";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function ExpenseList() {
    // Ideally we should join these data, but for now we'll just fetch all and map on client
    const { data: expenses, loading } = useCollection<Expense>("expenses");
    const { data: categories } = useCollection<Category>("categories");
    const { data: accounts } = useCollection<Account>("accounts");

    if (loading) {
        return <div>Loading expenses...</div>;
    }

    if (!expenses || expenses.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No expenses found. Add one!</div>;
    }

    const getCategoryName = (id: string) => categories?.find(c => c.id === id)?.name || "Unknown";
    const getAccountName = (id: string) => accounts?.find(a => a.id === id)?.name || "Unknown";

    return (
        <div className="rounded-md border">
            <Table>
                <TableCaption>A list of your recent expenses.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                            <TableCell>{expense.date ? format((expense.date as unknown as { toDate: () => Date }).toDate ? (expense.date as unknown as { toDate: () => Date }).toDate() : new Date(expense.date), "MMM d, yyyy") : "No Date"}</TableCell>
                            <TableCell className="font-medium">{expense.description}</TableCell>
                            <TableCell>
                                <Badge variant="secondary">{getCategoryName(expense.categoryId)}</Badge>
                            </TableCell>
                            <TableCell>{getAccountName(expense.accountId)}</TableCell>
                            <TableCell className="text-right">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency }).format(expense.amount)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
