"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Expense } from "@/types";
import { format, eachDayOfInterval, isSameDay, subDays } from "date-fns";

interface MonthlyChartProps {
    expenses: Expense[];
}

export function MonthlyChart({ expenses }: MonthlyChartProps) {
    const data = useMemo(() => {
        const today = new Date();
        const start = subDays(today, 30);
        const end = today;
        const days = eachDayOfInterval({ start, end });

        return days.map(day => {
            const dayExpenses = expenses.filter(expense => {
                const expenseDate = (expense.date as unknown as { toDate: () => Date }).toDate
                    ? (expense.date as unknown as { toDate: () => Date }).toDate()
                    : new Date(expense.date);
                return isSameDay(expenseDate, day);
            });

            const income = dayExpenses
                .filter(e => e.type === 'income')
                .reduce((sum, exp) => sum + exp.amount, 0);

            const expense = dayExpenses
                .filter(e => e.type === 'expense' || !e.type)
                .reduce((sum, exp) => sum + exp.amount, 0);

            return {
                date: format(day, "MMM dd"),
                income,
                expense,
            };
        });
    }, [expenses]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cash Flow (30 Days)</CardTitle>
                <CardDescription>
                    Income vs Expenses
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        {payload[0].payload.date}
                                                    </span>
                                                    <span className="font-bold text-green-600">
                                                        +${payload[0].payload.income.toFixed(2)}
                                                    </span>
                                                    <span className="font-bold text-red-600">
                                                        -${payload[0].payload.expense.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Bar dataKey="income" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
