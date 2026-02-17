import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { Expense } from "@/types";

export function flattenExpenses(expenses: Expense[]): Expense[] {
  return expenses.flatMap(expense => {
    if (expense.splits && expense.splits.length > 0) {
      return expense.splits.map((split, index) => ({
        ...expense,
        id: `${expense.id}-split-${index}`,
        amount: split.amount,
        categoryId: split.categoryId,
        description: split.description
          ? `${expense.description} (${split.description})`
          : expense.description,
        // Ensure we don't recurse or duplicate splits
        splits: undefined,
      }));
    }
    return expense;
  });
}
