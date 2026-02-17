"use client";

import { useCollection } from "@/hooks/use-firestore";
import { Goal } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Target } from "lucide-react";
import { useCurrency } from "@/components/providers/currency-provider";
import { updateDocument, deleteDocument } from "@/lib/firestore-service";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function GoalList() {
    const { user } = useAuth();
    const { data: goals, loading } = useCollection<Goal>("goals", user?.uid);
    const { convert, format: formatCurrency, currency } = useCurrency();
    const [addAmountMap, setAddAmountMap] = useState<Record<string, string>>({});

    if (loading) {
        return <div>Loading goals...</div>;
    }

    const handleDelete = async (goalId: string) => {
        if (!confirm("Are you sure you want to delete this goal?")) return;
        try {
            await deleteDocument("goals", goalId);
            toast.success("Deleted goal");
        } catch (error) {
            console.error("Error deleting", error);
            toast.error("Failed to delete");
        }
    };

    const handleAddSavings = async (goal: Goal) => {
        const amountStr = addAmountMap[goal.id];
        const amountToAdd = parseFloat(amountStr);

        if (!amountToAdd || isNaN(amountToAdd) || amountToAdd <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        try {
            await updateDocument("goals", goal.id, {
                currentAmount: (goal.currentAmount || 0) + amountToAdd,
                updatedAt: new Date(),
            });
            setAddAmountMap(prev => ({ ...prev, [goal.id]: "" }));
            toast.success(`Broadened horizon! Added ${amountToAdd} to goal.`);
        } catch (error) {
            console.error("Error updating goal", error);
            toast.error("Failed to update goal");
        }
    };

    if (goals.length === 0) {
        return (
            <div className="text-center py-10">
                <Target className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-semibold">No goals set yet</h3>
                <p className="text-sm text-muted-foreground">Start saving for something special!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {goals.map(goal => {
                const current = convert(goal.currentAmount || 0, goal.currency, currency);
                const target = convert(goal.targetAmount, goal.currency, currency);
                const percent = Math.min((current / target) * 100, 100);
                const isCompleted = current >= target;

                return (
                    <Card key={goal.id} className={isCompleted ? "border-green-500 bg-green-50/50 dark:bg-green-950/10" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {goal.name}
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(current)}
                                <span className="text-xs text-muted-foreground font-normal ml-1">
                                    / {formatCurrency(target)}
                                </span>
                            </div>
                            <Progress value={percent} className="mt-2 h-2" />
                            <p className="text-xs text-muted-foreground mt-2">
                                {percent.toFixed(0)}% reached
                            </p>

                            {!isCompleted && (
                                <div className="mt-4 flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Add amount..."
                                        className="h-8 text-xs"
                                        value={addAmountMap[goal.id] || ""}
                                        onChange={(e) => setAddAmountMap(prev => ({ ...prev, [goal.id]: e.target.value }))}
                                    />
                                    <Button size="sm" variant="outline" className="h-8" onClick={() => handleAddSavings(goal)}>
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                            {isCompleted && (
                                <div className="mt-4 flex items-center gap-2 text-green-600 font-medium text-sm">
                                    <Target className="h-4 w-4" /> Goal Reached!
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
