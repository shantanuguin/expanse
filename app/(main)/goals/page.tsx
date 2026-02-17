"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { GoalList } from "@/components/features/goals/goal-list";
import { GoalForm } from "@/components/features/goals/goal-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function GoalsPage() {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
                    <p className="text-muted-foreground">
                        Set targets and track your savings progress. 🎯
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Goal
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Savings Goal</DialogTitle>
                            <DialogDescription>
                                set a target amount for your goal.
                            </DialogDescription>
                        </DialogHeader>
                        <GoalForm onSuccess={() => setOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <GoalList />
        </div>
    );
}
