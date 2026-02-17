"use client";

import { useCollection } from "@/hooks/use-firestore";
import { Expense, Category, Budget } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, CreditCard, Activity, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

import { MonthlyChart } from "@/components/features/charts/monthly-chart";
import { CategoryPieChart } from "@/components/features/charts/category-pie-chart";
import { useAuth } from "@/components/providers/auth-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { flattenExpenses } from "@/lib/utils";

/* ── Animation Variants ── */
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const } },
};

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
        .filter(e => e.type === 'expense' || !e.type)
        .reduce((sum, exp) => sum + convert(exp.amount, exp.currency, currency), 0);

    const netBalance = totalIncome - totalExpenses;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

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

    const recentExpenses = [...expenses].sort((a, b) => {
        const dateA = (a.date as unknown as { toDate: () => Date }).toDate ? (a.date as unknown as { toDate: () => Date }).toDate() : new Date(a.date);
        const dateB = (b.date as unknown as { toDate: () => Date }).toDate ? (b.date as unknown as { toDate: () => Date }).toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
    }).slice(0, 5);

    return (
        <motion.div
            className="flex flex-col gap-6 md:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={itemVariants}>
                <h1 className="font-heading tracking-tight">Dashboard</h1>
            </motion.div>

            {/* ── Summary Cards ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card className="rounded-2xl card-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                        <div className={`text-2xl font-bold font-heading ${netBalance >= 0 ? 'text-emerald-600' : 'text-[#F54142]'}`}>
                            {formatCurrency(netBalance)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Lifetime</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl card-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                        <div className="text-2xl font-bold font-heading text-emerald-600">{formatCurrency(monthlyIncome)}</div>
                        <p className="text-xs text-muted-foreground mt-1">This month</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl card-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30">
                            <CreditCard className="h-4 w-4 text-[#F54142]" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                        <div className="text-2xl font-bold font-heading text-[#F54142]">{formatCurrency(monthlyExpenses)}</div>
                        <p className="text-xs text-muted-foreground mt-1">This month</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl card-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Budgets</CardTitle>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                        <div className="text-2xl font-bold font-heading">{budgets.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active</p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Budget Overview ── */}
            {budgets.length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="rounded-2xl card-hover">
                        <CardHeader className="px-6 pt-6">
                            <CardTitle className="text-base font-heading">Budget Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 px-6 pb-6">
                            {budgets.map(budget => {
                                const category = categories.find(c => c.id === budget.categoryId);
                                const now = new Date();

                                const spent = expenses
                                    .filter(exp => (exp.type === 'expense' || !exp.type))
                                    .filter(exp => {
                                        if (exp.categoryId !== budget.categoryId) return false;
                                        const d = (exp.date as unknown as { toDate: () => Date }).toDate ? (exp.date as unknown as { toDate: () => Date }).toDate() : new Date(exp.date);
                                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                                    })
                                    .reduce((sum, exp) => sum + convert(exp.amount, exp.currency, currency), 0);

                                const limit = convert(budget.amount, budget.currency || 'USD', currency);
                                const percent = Math.min((spent / limit) * 100, 100);
                                const isOver = spent > limit;

                                return (
                                    <div key={budget.id} className="space-y-2.5 p-4 rounded-xl bg-muted/40 border border-transparent hover:border-primary/20 transition-colors">
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <div className="flex items-center gap-2 font-semibold">
                                                {category?.name}
                                                {isOver && <AlertCircle className="h-3 w-3 text-destructive" />}
                                            </div>
                                            <span className={isOver ? "text-destructive font-bold" : "text-muted-foreground"}>{percent.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={percent} className={isOver ? "bg-destructive/20 [&>*]:bg-destructive" : ""} />
                                        <div className="text-[11px] text-muted-foreground flex justify-between">
                                            <span>{formatCurrency(spent)}</span>
                                            <span>of {formatCurrency(limit)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* ── Charts ── */}
            <motion.div variants={itemVariants} className="grid gap-5 grid-cols-1 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <MonthlyChart expenses={expenses} />
                </div>
                <div className="lg:col-span-3">
                    <CategoryPieChart expenses={expenses.filter(e => e.type === 'expense' || !e.type)} categories={categories} />
                </div>
            </motion.div>

            {/* ── Recent Transactions & Quick Actions ── */}
            <motion.div variants={itemVariants} className="grid gap-5 grid-cols-1 lg:grid-cols-3">
                <Card className="lg:col-span-2 rounded-2xl card-hover">
                    <CardHeader className="px-6 pt-6">
                        <CardTitle className="font-heading text-base">Recent Transactions</CardTitle>
                        <CardDescription>
                            {expenses.length} transactions total
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="space-y-5">
                            {recentExpenses.length > 0 ? (
                                recentExpenses.map(expense => (
                                    <div className="flex items-center gap-4" key={expense.id}>
                                        <div className={`flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 ${expense.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                            {expense.type === 'income'
                                                ? <TrendingUp className="h-4 w-4 text-emerald-600" />
                                                : <CreditCard className="h-4 w-4 text-[#F54142]" />
                                            }
                                        </div>
                                        <div className="space-y-0.5 flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-none truncate">{expense.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format((expense.date as unknown as { toDate: () => Date }).toDate ? (expense.date as unknown as { toDate: () => Date }).toDate() : new Date(expense.date), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                        <div className={`font-semibold text-sm tabular-nums ${expense.type === 'income' ? 'text-emerald-600' : 'text-[#F54142]'}`}>
                                            {expense.type === 'income' ? '+' : '-'}{expense.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl card-hover">
                    <CardHeader className="px-6 pt-6">
                        <CardTitle className="font-heading text-base">Quick Actions</CardTitle>
                        <CardDescription>Common tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 space-y-3">
                        <Link href="/add" className="block">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl btn-scale text-sm font-medium">
                                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#F54142]/10">
                                    <Plus className="h-4 w-4 text-[#F54142]" />
                                </div>
                                Add Transaction
                            </Button>
                        </Link>
                        <Link href="/expenses" className="block">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl btn-scale text-sm font-medium">
                                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                                    <Activity className="h-4 w-4 text-primary" />
                                </div>
                                View All Expenses
                            </Button>
                        </Link>
                        <Link href="/budgets" className="block">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl btn-scale text-sm font-medium">
                                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                </div>
                                Manage Budgets
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
