"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/components/providers/auth-provider";
import { useCollection } from "@/hooks/use-firestore";
import { addDocument, updateDocument, budgetsCollection } from "@/lib/firestore-service";
import { Category, Budget } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const budgetSchema = z.object({
    categoryId: z.string().min(1, "Category is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    period: z.enum(["monthly", "yearly"]),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
    existingBudget?: Budget;
    onSuccess?: () => void;
}

export function BudgetForm({ existingBudget, onSuccess }: BudgetFormProps) {
    const { user } = useAuth();
    const { data: categories } = useCollection<Category>("categories", user?.uid);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<BudgetFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(budgetSchema) as any,
        defaultValues: {
            categoryId: existingBudget?.categoryId || "",
            amount: existingBudget?.amount || 0,
            period: (existingBudget?.period as "monthly" | "yearly") || "monthly",
        },
    });

    async function onSubmit(data: BudgetFormValues) {
        if (!user) return;
        setIsSubmitting(true);

        try {
            if (existingBudget) {
                // Update
                // Note: updateDocument helper logic might need check. 
                // Assuming we use standard firestore update
                await updateDocument("budgets", existingBudget.id, {
                    ...data,
                    updatedAt: new Date(),
                });
                toast.success("Budget updated!");
            } else {
                // Create
                await addDocument(budgetsCollection, {
                    ...data,
                    currency: "USD", // Default for now, or fetch from user settings/context? 
                    // Ideally we store budget in base currency or user's preference. 
                    // Let's assume USD or user's Currency Context currency but for now hardcode or use simple number.
                }, user.uid);
                toast.success("Budget set!");
            }
            if (onSuccess) onSuccess();
            if (!existingBudget) form.reset();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save budget.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!existingBudget}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Limit Amount</FormLabel>
                            <FormControl>
                                <Input type="number" step="1" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Period</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Budget"}
                </Button>
            </form>
        </Form>
    );
}
