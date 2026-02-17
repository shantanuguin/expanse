"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Expense, Category } from "@/types";

interface CategoryPieChartProps {
    expenses: Expense[];
    categories: Category[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#6366f1'];

export function CategoryPieChart({ expenses, categories }: CategoryPieChartProps) {
    const data = useMemo(() => {
        const categoryTotals: Record<string, number> = {};

        expenses.forEach(expense => {
            const amount = expense.amount;
            const categoryId = expense.categoryId;

            // If expense has splits, we shouldn't be here if we flattened it, 
            // but if we reuse this component elsewhere without flattening:
            if (expense.splits?.length) {
                expense.splits.forEach(split => {
                    if (categoryTotals[split.categoryId]) {
                        categoryTotals[split.categoryId] += split.amount;
                    } else {
                        categoryTotals[split.categoryId] = split.amount;
                    }
                });
                return;
            }

            if (categoryTotals[categoryId]) {
                categoryTotals[categoryId] += amount;
            } else {
                categoryTotals[categoryId] = amount;
            }
        });

        // Map to array and sort
        return Object.entries(categoryTotals)
            .map(([categoryId, total]) => {
                const category = categories.find(c => c.id === categoryId);
                return {
                    name: category?.name || "Uncategorized",
                    value: total,
                };
            })
            .sort((a, b) => b.value - a.value)
            .filter(item => item.value > 0);
    }, [expenses, categories]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>
                    Where your money went (All time)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                label={({ name, percent }: any) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
