import { Category } from "@/types";

export const DEFAULT_CATEGORIES: Omit<Category, "id" | "userId" | "createdAt" | "updatedAt">[] = [
    { name: "Food", color: "#F59E0B", icon: "🍔", type: "expense" },
    { name: "Transport", color: "#3B82F6", icon: "🚗", type: "expense" },
    { name: "Shopping", color: "#EC4899", icon: "🛍️", type: "expense" },
    { name: "Entertainment", color: "#8B5CF6", icon: "🎬", type: "expense" },
    { name: "Health", color: "#10B981", icon: "💊", type: "expense" },
    { name: "Bills", color: "#6B7280", icon: "🧾", type: "expense" },
    { name: "Education", color: "#FBBF24", icon: "🎓", type: "expense" },
    { name: "Travel", color: "#06B6D4", icon: "✈️", type: "expense" },
    { name: "Housing", color: "#EF4444", icon: "🏠", type: "expense" },
    { name: "Groceries", color: "#16A34A", icon: "🥦", type: "expense" },
    { name: "Income", color: "#22C55E", icon: "💰", type: "income" },
];
