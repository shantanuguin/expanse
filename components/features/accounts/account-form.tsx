"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/components/providers/currency-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { addDocument, accountsCollection } from "@/lib/firestore-service";
import { accountSchema, AccountFormValues } from "@/schema/account";
import { toast } from "sonner";

export function AccountForm({ onSuccess }: { onSuccess?: () => void }) {
    const { user } = useAuth();
    const { currency } = useCurrency();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<AccountFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(accountSchema) as any,
        defaultValues: {
            name: "",
            type: "Cash",
            balance: 0,
            currency: currency, // Default to global currency
        },
    });

    const onSubmit = async (data: AccountFormValues) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await addDocument(accountsCollection, {
                ...data,
                updatedAt: new Date(),
            }, user.uid);

            toast.success("Account created!");
            form.reset();
            onSuccess?.();
        } catch (error) {
            console.error("Error creating account", error);
            toast.error("Failed to create account");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Chase Checking" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Bank">Bank</SelectItem>
                                        <SelectItem value="Credit">Credit</SelectItem>
                                        <SelectItem value="Wallet">Wallet</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Currency" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="JOD">JOD</SelectItem>
                                        <SelectItem value="INR">INR</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Initial Balance</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Wallet className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input type="number" step="0.01" className="pl-9" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => form.reset()}>Reset</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Account"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
