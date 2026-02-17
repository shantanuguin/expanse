import { z } from "zod";

export const expenseSchema = z.object({
    type: z.enum(["income", "expense"]).default("expense"),
    amount: z.coerce.number().positive("Amount must be positive"),
    currency: z.enum(['USD', 'JOD', 'INR']),
    description: z.string().min(1, "Description is required"),
    categoryId: z.string().min(1, "Select a category"),
    accountId: z.string().min(1, "Select an account"),
    date: z.date(),
    merchant: z.string().optional(),
    notes: z.string().optional(),
    tags: z.string().optional(), // We'll parse comma-separated string
    splits: z.array(z.object({
        amount: z.coerce.number().positive("Amount must be positive"),
        categoryId: z.string().min(1, "Select a category"),
        description: z.string().optional(),
    })).optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
