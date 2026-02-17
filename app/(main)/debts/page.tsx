"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DebtList } from "@/components/features/debts/debt-list";
import { DebtForm } from "@/components/features/debts/debt-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function DebtsPage() {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-heading">Debts & IOUs</h1>
                    <p className="text-muted-foreground">
                        Track money you lent or borrowed.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Record
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Debt Record</DialogTitle>
                            <DialogDescription>
                                Track a new loan or borrowed amount.
                            </DialogDescription>
                        </DialogHeader>
                        <DebtForm onSuccess={() => setOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <DebtList />
        </div>
    );
}
