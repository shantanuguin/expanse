export type Currency = 'USD' | 'JOD' | 'INR';

export interface Account {
    id: string;
    name: string;
    type: 'Cash' | 'Bank' | 'Credit' | 'Wallet' | 'Other';
    balance: number;
    currency: Currency;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense';
    budget?: number; // Monthly budget in base currency
    color?: string;
    icon?: string;
    isDefault?: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Split {
    amount: number;
    categoryId: string;
    description?: string; // Optional description for the split
}

export interface Expense {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    currency: Currency;
    description: string;
    categoryId: string; // Primary category (or "Split" if splits exist)
    accountId: string;
    date: Date; // stored as Timestamp in Firestore
    receiptUrl?: string;
    notes?: string;
    tags?: string[];
    splits?: Split[];
    userId: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface RecurringExpense {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    currency: Currency;
    description: string;
    categoryId: string;
    accountId: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate: Date;
    endDate?: Date;
    nextDueDate: Date; // Renamed from nextDate for clarity
    lastGenerated?: Date;
    active: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Budget {
    id: string;
    categoryId: string;
    amount: number;
    currency: Currency;
    period: 'monthly' | 'yearly';
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Debt {
    id: string;
    type: 'lent' | 'borrowed';
    personName: string;
    amount: number;
    currency: Currency;
    description?: string;
    dueDate?: Date;
    isPaid: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    currency: Currency;
    deadline?: Date;
    color?: string;
    icon?: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
