"use client";

import { useCollection } from "@/hooks/use-firestore";
import { Account } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Receipt } from "lucide-react";
import { deleteDocument } from "@/lib/firestore-service";
import { toast } from "sonner";

export function AccountList() {
    const { user } = useAuth();
    const { data: accounts, loading } = useCollection<Account>("accounts", user?.uid);

    if (loading) {
        return <div>Loading accounts...</div>;
    }

    const handleDelete = async (accountId: string) => {
        if (!confirm("Are you sure you want to delete this account? Expenses linked to it will remain but lose their account reference.")) return;
        try {
            await deleteDocument("accounts", accountId);
            toast.success("Deleted account");
        } catch (error) {
            console.error("Error deleting", error);
            toast.error("Failed to delete");
        }
    };

    if (accounts.length === 0) {
        return (
            <div className="text-center py-10">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-semibold">No accounts found</h3>
                <p className="text-sm text-muted-foreground">Add your bank accounts, cash wallets, or credit cards.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map(account => (
                <Card key={account.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {account.name}
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {/* Display balance in native currency */}
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: account.currency }).format(account.balance)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                            {account.type} • {account.currency}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
