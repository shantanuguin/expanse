"use client";

import { useCollection } from "@/hooks/use-firestore";
import { Expense, Category, Budget } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, CreditCard, Activity, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

import { MonthlyChart } from "@/components/features/charts/monthly-chart";
import { CategoryPieChart } from "@/components/features/charts/category-pie-chart";
import { useAuth } from "@/components/providers/auth-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { flattenExpenses } from "@/lib/utils";

export default function DashboardPage() {
    const { user } = useAuth();
    const { data: rawExpenses } = useCollection<Expense>("expenses", user?.uid);
    const { data: categories } = useCollection<Category>("categories", user?.uid);
    const { data: budgets } = useCollection<Budget>("budgets", user?.uid);
    const { convert, format: formatCurrency, currency } = useCurrency();

    const expenses = flattenExpenses(rawExpenses);

    // Calculate totals
    const totalIncome = expenses
        .filter(e => e.type === 'income')
        .reduce((sum, exp) => sum + convert(exp.amount, exp.currency, currency), 0);

    const totalExpenses = expenses
        .filter(e => e.type === 'expense' || !e.type) // Handle legacy data as expense
        .reduce((sum, exp) => sum + convert(exp.amount, exp.currency, currency), 0);

    const netBalance = totalIncome - totalExpenses;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Monthly totals
    const monthlyIncome = expenses
        .filter(e => e.type === 'income')
        .filter(exp => {
            const d = (exp.date as unknown as { toDate: () => Date }).toDate ? (exp.date as unknown as { toDate: () => Date }).toDate() : new Date(exp.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, exp) => sum + convert(exp.amount, exp.currency, currency), 0);

    const monthlyExpenses = expenses
        .filter(e => e.type === 'expense' || !e.type)
        .filter(exp => {
            const d = (exp.date as unknown as { toDate: () => Date }).toDate ? (exp.date as unknown as { toDate: () => Date }).toDate() : new Date(exp.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, exp) => sum + convert(exp.amount, exp.currency, currency), 0);

    // Recent transactions (limit 5)
    const recentExpenses = [...expenses].sort((a, b) => {
        const dateA = (a.date as unknown as { toDate: () => Date }).toDate ? (a.date as unknown as { toDate: () => Date }).toDate() : new Date(a.date);
        const dateB = (b.date as unknown as { toDate: () => Date }).toDate ? (b.date as unknown as { toDate: () => Date }).toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
    }).slice(0, 5);

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(netBalance)}
                        </div>
                        <p className="text-xs text-muted-foreground">Lifetime</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Income (Mo)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlyIncome)}</div>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expenses (Mo)</CardTitle>
                        <CreditCard className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(monthlyExpenses)}</div>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{budgets.length}</div>
                        <p className="text-xs text-muted-foreground">Tracking</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            {/* Budget Summary */}
            {budgets.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Budget Overviews</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {budgets.map(budget => {
                                const category = categories.find(c => c.id === budget.categoryId);
                                const now = new Date();
                                const currentMonth = now.getMonth();
                                const currentYear = now.getFullYear();

                                const spent = expenses
                                    .filter(exp => (exp.type === 'expense' || !exp.type)) // Only count expenses
                                    .filter(exp => {
                                        if (exp.categoryId !== budget.categoryId) return false;
                                        const d = (exp.date as unknown as { toDate: () => Date }).toDate ? (exp.date as unknown as { toDate: () => Date }).toDate() : new Date(exp.date);
                                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                                    })
                                    .reduce((sum, exp) => sum + convert(exp.amount, exp.currency, currency), 0);

                                const limit = convert(budget.amount, budget.currency || 'USD', currency);
                                const percent = Math.min((spent / limit) * 100, 100);
                                const isOver = spent > limit;

                                return (
                                    <div key={budget.id} className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <div className="flex items-center gap-2">
                                                {category?.name}
                                                {isOver && <AlertCircle className="h-3 w-3 text-destructive" />}
                                            </div>
                                            <span>{percent.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={percent} className={isOver ? "bg-destructive/20 [&>*]:bg-destructive" : ""} />
                                        <div className="text-[10px] text-muted-foreground flex justify-between">
                                            <span>{formatCurrency(spent)}</span>
                                            <span>of {formatCurrency(limit)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <MonthlyChart expenses={expenses} />
                </div>
                <div className="lg:col-span-3">
                    <CategoryPieChart expenses={expenses.filter(e => e.type === 'expense' || !e.type)} categories={categories} />
                </div>
            </div>

            {/* Recent Transactions & Quick Actions Grid */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">

                {/* Recent Transactions (Spans 2 columns on large screens) */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>
                            You made {expenses.length} transactions in total.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentExpenses.length > 0 ? (
                                recentExpenses.map(expense => (
                                    <div className="flex items-center" key={expense.id}>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{expense.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format((expense.date as unknown as { toDate: () => Date }).toDate ? (expense.date as unknown as { toDate: () => Date }).toDate() : new Date(expense.date), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                        <div className={`ml-auto font-medium ${expense.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {expense.type === 'income' ? '+' : '-'}{expense.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No recent transactions.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href="/add" className="w-full">
                            <Button variant="outline" className="w-full justify-start">
                                <Plus className="mr-2 h-4 w-4" /> Add Expense
                            </Button>
                        </Link>
                        <Link href="/expenses" className="w-full">
                            <Button variant="outline" className="w-full justify-start">
                                <Activity className="mr-2 h-4 w-4" /> View All Expenses
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
