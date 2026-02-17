"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/components/providers/auth-provider";
import { useCollection } from "@/hooks/use-firestore";
import { addDocument, updateDocument, recurringExpensesCollection } from "@/lib/firestore-service";
import { Category, Account, RecurringExpense } from "@/types";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/components/providers/currency-provider";

const recurringSchema = z.object({
    type: z.enum(["income", "expense"]).default("expense"),
    description: z.string().min(1, "Description is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    categoryId: z.string().min(1, "Category is required"),
    accountId: z.string().min(1, "Account is required"),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    startDate: z.date(),
    active: z.boolean().default(true),
});

type RecurringFormValues = z.infer<typeof recurringSchema>;

interface RecurringFormProps {
    existingRecurring?: RecurringExpense;
    onSuccess?: () => void;
}

export function RecurringForm({ existingRecurring, onSuccess }: RecurringFormProps) {
    const { user } = useAuth();
    const { data: categories } = useCollection<Category>("categories", user?.uid);
    const { data: accounts } = useCollection<Account>("accounts", user?.uid);
    const { currency } = useCurrency();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<RecurringFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(recurringSchema) as any,
        defaultValues: {
            type: existingRecurring?.type || "expense",
            description: existingRecurring?.description || "",
            amount: existingRecurring?.amount || 0,
            categoryId: existingRecurring?.categoryId || "",
            accountId: existingRecurring?.accountId || "",
            frequency: existingRecurring?.frequency || "monthly",
            startDate: existingRecurring?.startDate
                ? (existingRecurring.startDate as unknown as { toDate: () => Date }).toDate
                    ? (existingRecurring.startDate as unknown as { toDate: () => Date }).toDate()
                    : new Date(existingRecurring.startDate)
                : new Date(),
            active: existingRecurring?.active ?? true,
        },
    });

    async function onSubmit(data: RecurringFormValues) {
        if (!user) return;
        setIsSubmitting(true);

        try {
            if (existingRecurring) {
                await updateDocument("recurring_expenses", existingRecurring.id, {
                    ...data,
                    // If we change frequency/start, we might need to recalc nextDueDate. 
                    // For simplicity, let's update basic fields.
                    updatedAt: new Date(),
                });
                toast.success("Subscription updated!");
            } else {
                await addDocument(recurringExpensesCollection, {
                    ...data,
                    currency: currency, // Use current display currency or provide selector?
                    nextDueDate: data.startDate, // Initial next due date is start date
                    updatedAt: new Date(),
                }, user.uid);
                toast.success("Subscription created!");
            }
            if (onSuccess) onSuccess();
            if (!existingRecurring) form.reset();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save subscription.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Type</FormLabel>
                            <FormControl>
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant={field.value === "expense" ? "default" : "outline"}
                                        className="flex-1"
                                        onClick={() => field.onChange("expense")}
                                    >
                                        Expense
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={field.value === "income" ? "default" : "outline"}
                                        className="flex-1"
                                        onClick={() => field.onChange("income")}
                                    >
                                        Income
                                    </Button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="Netflix, Rent, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex gap-4">
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
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
                        name="accountId"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Account</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {accounts.map((acc) => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Saving..." : "Save Subscription"}
                </Button>
            </form>
        </Form>
    );
}
