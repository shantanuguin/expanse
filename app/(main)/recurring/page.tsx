"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useCollection } from "@/hooks/use-firestore";
import { useCurrency } from "@/components/providers/currency-provider";
import { RecurringExpense, Category } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw, CheckCircle } from "lucide-react";
import { RecurringForm } from "@/components/features/recurring/recurring-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { addDocument, updateDocument, expensesCollection } from "@/lib/firestore-service";
import { toast } from "sonner";

export default function RecurringPage() {
    const { user } = useAuth();
    const { data: recurring, loading } = useCollection<RecurringExpense>("recurring_expenses", user?.uid);
    const { data: categories } = useCollection<Category>("categories", user?.uid);
    const { format: formatCurrency } = useCurrency();
    const [openDia, setOpenDia] = useState(false);
    const [generating, setGenerating] = useState(false);

    if (loading) return <div className="p-8">Loading subscriptions...</div>;

    const handleGenerate = async () => {
        setGenerating(true);
        let count = 0;
        const now = new Date();

        try {
            for (const sub of recurring) {
                if (!sub.active) continue;

                const nextDue = (sub.nextDueDate as unknown as { toDate: () => Date }).toDate ? (sub.nextDueDate as unknown as { toDate: () => Date }).toDate() : new Date(sub.nextDueDate);

                if (nextDue <= now) {
                    // It's due! Create expense
                    await addDocument(expensesCollection, {
                        type: sub.type,
                        amount: sub.amount,
                        currency: sub.currency,
                        description: sub.description,
                        categoryId: sub.categoryId,
                        accountId: sub.accountId,
                        date: nextDue,
                        notes: "Generated from subscription",
                    }, user!.uid);

                    // Calculate new nextDueDate
                    const newNextDate = new Date(nextDue);
                    if (sub.frequency === 'daily') newNextDate.setDate(newNextDate.getDate() + 1);
                    if (sub.frequency === 'weekly') newNextDate.setDate(newNextDate.getDate() + 7);
                    if (sub.frequency === 'monthly') newNextDate.setMonth(newNextDate.getMonth() + 1);
                    if (sub.frequency === 'yearly') newNextDate.setFullYear(newNextDate.getFullYear() + 1);

                    await updateDocument("recurring_expenses", sub.id, {
                        nextDueDate: newNextDate,
                        lastGenerated: new Date(),
                    });
                    count++;
                }
            }
            if (count > 0) {
                toast.success(`Generated ${count} due expenses.`);
            } else {
                toast.info("No expenses due.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error generating expenses.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-heading">Subscriptions</h1>
                    <p className="text-muted-foreground">Manage recurring bills and expenses.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                        <RefreshCcw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                        Check Due
                    </Button>
                    <Dialog open={openDia} onOpenChange={setOpenDia}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Add New</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Subscription</DialogTitle>
                            </DialogHeader>
                            <RecurringForm onSuccess={() => setOpenDia(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recurring.map(sub => {
                    const category = categories.find(c => c.id === sub.categoryId);
                    const nextDue = (sub.nextDueDate as unknown as { toDate: () => Date }).toDate ? (sub.nextDueDate as unknown as { toDate: () => Date }).toDate() : new Date(sub.nextDueDate);

                    return (
                        <Card key={sub.id} className="rounded-2xl card-hover">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {sub.description}
                                </CardTitle>
                                {sub.active ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="text-xs text-muted-foreground">Inactive</div>}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(sub.amount)}</div>
                                <p className="text-xs text-muted-foreground">{category?.name} • {sub.frequency}</p>
                                <div className="mt-4 text-xs text-muted-foreground">
                                    Next due: {format(nextDue, "MMM d, yyyy")}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
