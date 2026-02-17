"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useCollection } from "@/hooks/use-firestore";
import { useCurrency } from "@/components/providers/currency-provider";
import { Budget, Category, Expense } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { BudgetForm } from "@/components/features/budgets/budget-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function BudgetsPage() {
    const { user } = useAuth();
    const { data: budgets, loading: budgetsLoading } = useCollection<Budget>("budgets", user?.uid);
    const { data: expenses, loading: expensesLoading } = useCollection<Expense>("expenses", user?.uid);
    const { data: categories } = useCollection<Category>("categories", user?.uid);
    const { convert, format, currency } = useCurrency();
    const [openDia, setOpenDia] = useState(false);

    if (budgetsLoading || expensesLoading) return <div className="p-8">Loading budgets...</div>;

    // Helper to calculate spending for a category in current period
    const getSpending = (categoryId: string, period: 'monthly' | 'yearly') => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return expenses
            .filter(exp => {
                if (exp.categoryId !== categoryId) return false;
                const d = (exp.date as unknown as { toDate: () => Date }).toDate ? (exp.date as unknown as { toDate: () => Date }).toDate() : new Date(exp.date);
                if (period === 'monthly') {
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                } else {
                    return d.getFullYear() === currentYear;
                }
            })
            .reduce((sum, exp) => sum + convert(exp.amount, exp.currency, currency), 0);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
                    <p className="text-muted-foreground">Manage your spending limits.</p>
                </div>
                <Dialog open={openDia} onOpenChange={setOpenDia}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Set Budget</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Set Category Budget</DialogTitle>
                        </DialogHeader>
                        <BudgetForm onSuccess={() => setOpenDia(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {budgets.map(budget => {
                    const category = categories.find(c => c.id === budget.categoryId);
                    const spent = getSpending(budget.categoryId, budget.period);
                    // Assume budget.amount is in user's base currency setting (or we should store currency in budget).
                    // For now, let's treat budget.amount as being in "Display Currency" conceptually, 
                    // or ideally we convert it if we stored it in USD. 
                    // Let's assume budget amount is set in preference of user, so we display it as is if it matches context, 
                    // or we should probably have stored the currency of the budget.
                    // Implementation Plan Step 676 used `currency: "USD"` hardcoded.
                    // So we should convert budget amount from USD to display currency.

                    const limit = convert(budget.amount, budget.currency || 'USD', currency);
                    const percent = Math.min((spent / limit) * 100, 100);
                    const isOver = spent > limit;

                    return (
                        <Card key={budget.id} className={isOver ? "border-destructive" : ""}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">
                                    {category?.name || "Unknown Category"}
                                </CardTitle>
                                {isOver && <AlertCircle className="h-4 w-4 text-destructive" />}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{format(spent)}</div>
                                <div className="text-xs text-muted-foreground flex justify-between mb-2">
                                    <span>of {format(limit)} limit</span>
                                    <span>{percent.toFixed(0)}%</span>
                                </div>
                                <Progress value={percent} className={isOver ? "bg-destructive/20 [&>*]:bg-destructive" : ""} />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
