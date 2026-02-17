"use client"

import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { Expense, Category, Account } from "@/types"
import { DataTableToolbar } from "@/components/features/expenses/data-table-toolbar"

interface ExpensesDataTableProps {
    expenses: Expense[];
    categories: Category[];
    accounts: Account[];
}

export function ExpensesDataTable({ expenses, categories, accounts }: ExpensesDataTableProps) {
    // Enrich data with category names and account names
    // We can use a map for O(1) lookup
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const accountMap = new Map(accounts.map(a => [a.id, a.name]));

    const data = expenses.map(expense => {
        let categoryName = categoryMap.get(expense.categoryId) || "Uncategorized";
        if (expense.splits && expense.splits.length > 0) {
            categoryName = "Split";
        }
        return {
            ...expense,
            categoryName,
            accountName: accountMap.get(expense.accountId) || "Unknown Account",
        };
    });

    // We can't easily modify the exported 'columns' array directly here without memoizing or mutation,
    // so we'll rely on the column definition knowing about 'categoryName' 
    // OR we pass a modified columns array.
    // Let's modify columns.tsx to expect 'categoryName'

    return (
        <DataTable
            columns={columns}
            data={data}
            toolbar={(table) => (
                <DataTableToolbar table={table} categories={categories} accounts={accounts} />
            )}
        />
    );
}
