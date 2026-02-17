"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AccountList } from "@/components/features/accounts/account-list";
import { AccountForm } from "@/components/features/accounts/account-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function AccountsPage() {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-heading">Accounts</h1>
                    <p className="text-muted-foreground">Manage your wallets and bank accounts.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Account</DialogTitle>
                            <DialogDescription>
                                Add a new account to track.
                            </DialogDescription>
                        </DialogHeader>
                        <AccountForm onSuccess={() => setOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <AccountList />
        </div>
    );
}
