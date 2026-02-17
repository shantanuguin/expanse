import { ExpenseForm } from "@/components/features/expense-form";

export default function AddPage() {
    return (
        <div className="space-y-4 max-w-lg mx-auto py-4 md:py-8">
            <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold tracking-tight font-heading">Add Transaction</h1>
                <p className="text-sm text-muted-foreground">
                    Speak or type — your choice
                </p>
            </div>
            <ExpenseForm />
        </div>
    );
}
