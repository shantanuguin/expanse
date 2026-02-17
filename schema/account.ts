import { z } from "zod";

export const accountSchema = z.object({
    name: z.string().min(1, "Account name is required"),
    type: z.enum(['Cash', 'Bank', 'Credit', 'Wallet', 'Other']),
    balance: z.coerce.number().default(0),
    currency: z.enum(['USD', 'JOD', 'INR']),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
