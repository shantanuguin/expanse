import { ExpenseForm } from "@/components/features/expense-form";

export default function AddPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Add Expense</h1>
                <p className="text-muted-foreground">
                    Log a new transaction manually or using your voice.
                </p>
            </div>
            <ExpenseForm />
        </div>
    );
}
