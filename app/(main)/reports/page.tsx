"use client";

import { useCollection } from "@/hooks/use-firestore";
import { Expense, Category, Account } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "@/components/features/export/export-button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useCurrency } from "@/components/providers/currency-provider";
import { flattenExpenses } from "@/lib/utils";

export default function ReportsPage() {
    const { user } = useAuth();
    const { data: rawExpenses, loading: loadingExpenses } = useCollection<Expense>("expenses", user?.uid);
    const { data: categories } = useCollection<Category>("categories", user?.uid);
    const { data: accounts } = useCollection<Account>("accounts", user?.uid);
    const { convert, currency, format: formatCurrency } = useCurrency();

    if (loadingExpenses) return <div>Loading reports...</div>;

    const expenses = flattenExpenses(rawExpenses);

    // Prepare maps for export
    const categoryMap = categories.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {} as Record<string, string>);
    const accountMap = accounts.reduce((acc, a) => ({ ...acc, [a.id]: a.name }), {} as Record<string, string>);

    // Aggregate by Year
    const yearData = expenses.reduce((acc, expense) => {
        const year = new Date(expense.date).getFullYear();
        if (!acc[year]) acc[year] = { year, income: 0, expense: 0 };

        const amount = convert(expense.amount, expense.currency, currency);
        if (expense.type === 'income') {
            acc[year].income += amount;
        } else {
            acc[year].expense += amount;
        }
        return acc;
    }, {} as Record<number, { year: number, income: number, expense: number }>);

    const chartData = Object.values(yearData).sort((a, b) => a.year - b.year);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-heading">Advanced Reports</h1>
                    <p className="text-muted-foreground">Analyze your financial history.</p>
                </div>
                <ExportButton
                    data={rawExpenses}
                    categoryMap={categoryMap}
                    accountMap={accountMap}
                    filename={`expenses_export_${new Date().toISOString().split('T')[0]}.csv`}
                />
            </div>

            <Card className="rounded-2xl card-hover">
                <CardHeader>
                    <CardTitle>Year-over-Year Summary</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis tickFormatter={(val) => formatCurrency(val)} />
                            <Tooltip formatter={(val: number | undefined) => formatCurrency(val || 0)} />
                            <Legend />
                            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Stats Cards could go here */}
            </div>
        </div>
    );
}
