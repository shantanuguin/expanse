export interface FieldConfidence {
    amount: "high" | "medium" | "low" | "none";
    currency: "high" | "medium" | "low" | "none";
    date: "high" | "medium" | "low" | "none";
    category: "high" | "medium" | "low" | "none";
    merchant: "high" | "medium" | "low" | "none";
    description: "high" | "medium" | "low" | "none";
}

export interface ParsedExpense {
    amount: number;
    currency: string;
    category: string;
    categoryName?: string;
    date: string;
    merchant: string;
    description: string;
    type: "expense" | "income";
    confidence: FieldConfidence;
}
