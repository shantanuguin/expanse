import { z } from "zod";

export const goalSchema = z.object({
    name: z.string().min(1, "Goal name is required"),
    targetAmount: z.coerce.number().positive("Target amount must be positive"),
    currentAmount: z.coerce.number().min(0, "Current saved amount cannot be negative").default(0),
    currency: z.string().min(3, "Select a currency"),
    deadline: z.date().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
});

export type GoalFormValues = z.infer<typeof goalSchema>;
