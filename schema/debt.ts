import { z } from "zod";

export const debtSchema = z.object({
    type: z.enum(["lent", "borrowed"]),
    personName: z.string().min(1, "Person name is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    currency: z.string().min(3, "Select a currency"),
    description: z.string().optional(),
    dueDate: z.date().optional(),
    isPaid: z.boolean().default(false),
});

export type DebtFormValues = z.infer<typeof debtSchema>;
