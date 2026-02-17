"use client";

import { useCollection } from "@/hooks/use-firestore";
import { Debt } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Trash2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useCurrency } from "@/components/providers/currency-provider";
import { updateDocument, deleteDocument } from "@/lib/firestore-service";
import { toast } from "sonner";
import { format } from "date-fns";

export function DebtList() {
    const { user } = useAuth();
    const { data: debts, loading } = useCollection<Debt>("debts", user?.uid);
    const { convert, format: formatCurrency, currency } = useCurrency();

    if (loading) {
        return <div>Loading debts...</div>;
    }

    const lent = debts.filter(d => d.type === 'lent' && !d.isPaid);
    const borrowed = debts.filter(d => d.type === 'borrowed' && !d.isPaid);
    const paid = debts.filter(d => d.isPaid);

    const handleMarkPaid = async (debt: Debt) => {
        try {
            await updateDocument("debts", debt.id, { isPaid: true });
            toast.success("Marked as paid");
        } catch (error) {
            console.error("Error marking paid", error);
            toast.error("Failed to update debt");
        }
    };

    const handleDelete = async (debtId: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await deleteDocument("debts", debtId);
            toast.success("Deleted debt record");
        } catch (error) {
            console.error("Error deleting", error);
            toast.error("Failed to delete");
        }
    };

    const DebtItem = ({ debt }: { debt: Debt }) => (
        <div className="flex items-center justify-between p-4 border rounded-2xl bg-card mb-2 shadow-sm card-hover">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${debt.type === 'lent' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {debt.type === 'lent' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                </div>
                <div>
                    <p className="font-semibold">{debt.personName}</p>
                    <p className="text-sm text-muted-foreground">{debt.description || (debt.type === 'lent' ? "You lent" : "You borrowed")}</p>
                    {debt.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Due: {format((debt.dueDate as unknown as { toDate: () => Date }).toDate ? (debt.dueDate as unknown as { toDate: () => Date }).toDate() : new Date(debt.dueDate), "MMM d, yyyy")}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className={`font-bold ${debt.type === 'lent' ? 'text-green-600' : 'text-red-600'}`}>
                        {debt.type === 'lent' ? '+' : '-'}{formatCurrency(convert(debt.amount, debt.currency, currency))}
                    </p>
                    <Badge variant={debt.isPaid ? "secondary" : "outline"} className="text-xs">
                        {debt.isPaid ? "Paid" : "Pending"}
                    </Badge>
                </div>
                <div className="flex gap-1">
                    {!debt.isPaid && (
                        <Button variant="ghost" size="icon" onClick={() => handleMarkPaid(debt)} title="Mark Paid">
                            <Check className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(debt.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-green-600">Owed to You</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {lent.length > 0 ? (
                            lent.map(d => <DebtItem key={d.id} debt={d} />)
                        ) : (
                            <p className="text-sm text-muted-foreground">No active records.</p>
                        )}
                    </CardContent>
                </Card>
                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-red-600">You Owe</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {borrowed.length > 0 ? (
                            borrowed.map(d => <DebtItem key={d.id} debt={d} />)
                        ) : (
                            <p className="text-sm text-muted-foreground">No active debts.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {paid.length > 0 && (
                <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4 text-muted-foreground">History (Paid)</h3>
                    {paid.map(d => <DebtItem key={d.id} debt={d} />)}
                </div>
            )}
        </div>
    );
}
