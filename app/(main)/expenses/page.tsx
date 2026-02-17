"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ExpensesDataTable } from "@/components/features/expenses/expenses-data-table";
import { useCollection } from "@/hooks/use-firestore";
import { Expense, Category, Account } from "@/types";

import { useAuth } from "@/components/providers/auth-provider";

// ...

export default function ExpensesPage() {
    const { user } = useAuth();
    const { data: expenses, loading: expensesLoading } = useCollection<Expense>("expenses", user?.uid);
    const { data: categories, loading: categoriesLoading } = useCollection<Category>("categories", user?.uid);
    const { data: accounts, loading: accountsLoading } = useCollection<Account>("accounts", user?.uid);

    if (expensesLoading || categoriesLoading || accountsLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading expenses...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground">
                        View and manage your transaction history.
                    </p>
                </div>
                <Link href="/add">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                </Link>
            </div>
            <ExpensesDataTable expenses={expenses} categories={categories} accounts={accounts} />
        </div>
    );
}

