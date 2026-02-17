"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Mic, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
import { Calendar } from "@/components/ui/calendar"; // Ensure this component exists
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea"; // Need to install textarea or use Input

import { expenseSchema, ExpenseFormValues } from "@/schema/expense";
import { addDocument, expensesCollection } from "@/lib/firestore-service";
import { useCollection } from "@/hooks/use-firestore";
import { Account, Category } from "@/types";

import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { parseExpenseText } from "@/lib/expense-parser";
import { useAuth } from "@/components/providers/auth-provider";

export function ExpenseForm() {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: categories } = useCollection<Category>("categories", user?.uid);
    const { data: accounts } = useCollection<Account>("accounts", user?.uid);

    const form = useForm<ExpenseFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(expenseSchema) as any,
        defaultValues: {
            type: "expense",
            amount: 0,
            currency: "USD",
            description: "",
            date: new Date(),
            merchant: "",
            notes: "",
            categoryId: "",
            accountId: "",
            tags: "",
        },
    });

    async function onSubmit(data: ExpenseFormValues) {
        if (!user) {
            toast.error("You must be logged in to add an expense.");
            return;
        }

        setIsSubmitting(true);
        try {
            await addDocument(expensesCollection, {
                ...data,
                tags: data.tags ? (typeof data.tags === 'string' ? data.tags.split(",").map(t => t.trim()) : data.tags) : [],
            }, user.uid);
            form.reset({
                type: data.type, // Keep same type for next entry
                amount: 0,
                currency: data.currency,
                description: "",
                date: new Date(),
                merchant: "",
                notes: "",
                categoryId: "",
                accountId: "",
                tags: "",
            });
            toast.success("Transaction added successfully!");
        } catch (error) {
            console.error("Failed to add transaction", error);
            toast.error("Failed to add transaction. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-4 md:p-8 bg-card rounded-lg shadow-sm border">

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Transaction Type</FormLabel>
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

                <div className="flex gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="0.00" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem className="w-24">
                                <FormLabel>Currency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Cur" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                        {/* Add more */}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex justify-between items-center">
                                Description
                                <VoiceInput onTranscript={(text) => {
                                    // Parse and fill form
                                    const parsed = parseExpenseText(text);
                                    if (parsed.description) form.setValue("description", parsed.description);
                                    if (parsed.amount) form.setValue("amount", parsed.amount);
                                    if (parsed.currency) form.setValue("currency", parsed.currency);
                                    if (parsed.merchant) form.setValue("merchant", parsed.merchant);
                                    if (parsed.date) form.setValue("date", parsed.date);
                                }} />
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input placeholder="Groceries, Uber, etc." {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />


                <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <FormLabel>Category Split</FormLabel>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const currentSplits = form.getValues("splits") || [];
                                if (currentSplits.length > 0) {
                                    form.setValue("splits", undefined);
                                    form.setValue("categoryId", "");
                                } else {
                                    form.setValue("splits", [
                                        { amount: 0, categoryId: "" },
                                        { amount: 0, categoryId: "" }
                                    ]);
                                    form.setValue("categoryId", "split"); // Marker
                                }
                            }}
                        >
                            {form.watch("splits")?.length ? "Disable Split" : "Enable Split"}
                        </Button>
                    </div>

                    {!form.watch("splits")?.length ? (
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories?.length ? categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                )) : <SelectItem value="default" disabled>No categories found</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <div className="space-y-3">
                            <div className="text-sm text-muted-foreground flex justify-between">
                                <span>Total: {form.watch("amount")}</span>
                                <span className={
                                    (form.watch("splits")?.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0) === Number(form.watch("amount"))
                                        ? "text-green-600"
                                        : "text-red-600"
                                }>
                                    Split Total: {form.watch("splits")?.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0}
                                </span>
                            </div>

                            {form.watch("splits")?.map((_, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <FormField
                                        control={form.control}
                                        name={`splits.${index}.categoryId`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {categories?.map(cat => (
                                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`splits.${index}.amount`}
                                        render={({ field }) => (
                                            <FormItem className="w-24">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.00"
                                                        {...field}
                                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            const splits = form.getValues("splits") || [];
                                            if (splits.length > 2) {
                                                form.setValue("splits", splits.filter((_, i) => i !== index));
                                            }
                                        }}
                                        disabled={(form.watch("splits")?.length || 0) <= 2}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const splits = form.getValues("splits") || [];
                                    form.setValue("splits", [...splits, { amount: 0, categoryId: "" }]);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Split
                            </Button>
                        </div>
                    )}

                    <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Account</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Account" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {accounts?.length ? accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                        )) : <SelectItem value="default" disabled>No accounts found</SelectItem>}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
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
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Additional details..." className="resize-none" {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tags (Comma separated)</FormLabel>
                            <FormControl>
                                <Input placeholder="work, travel, food" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => form.reset()}>Reset</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Expense"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
    const { isListening, startListening, stopListening, transcript } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            onTranscript(transcript);
        }
    }, [transcript, onTranscript]);

    return (
        <div className="flex items-center gap-2">
            <Button
                type="button"
                variant={isListening ? "destructive" : "secondary"}
                size="icon"
                onClick={isListening ? stopListening : startListening}
                title={isListening ? "Stop Listening" : "Start Voice Input"}
            >
                <Mic className={cn("h-4 w-4", isListening && "animate-pulse")} />
            </Button>
            {isListening && <span className="text-xs text-muted-foreground animate-pulse">Listening...</span>}
        </div>
    );
}
