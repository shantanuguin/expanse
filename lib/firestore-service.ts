import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    serverTimestamp,
    CollectionReference,
    DocumentData
} from 'firebase/firestore';
import { Account, Category, Expense, RecurringExpense, Budget, Debt, Goal } from '@/types';

// Collection references with type safety
const createCollection = <T>(collectionName: string) => {
    return collection(db, collectionName) as CollectionReference<T>;
};

export const accountsCollection = createCollection<Account>('accounts');
export const categoriesCollection = createCollection<Category>('categories');
export const expensesCollection = createCollection<Expense>('expenses');
export const budgetsCollection = createCollection<Budget>('budgets');
export const debtsCollection = createCollection<Debt>('debts');
export const goalsCollection = createCollection<Goal>('goals');
export const recurringExpensesCollection = createCollection<RecurringExpense>('recurring_expenses');

// Generic helper functions
// T must include userId now
export const addDocument = async <T extends { id: string, createdAt: unknown, userId: string }>(collectionRef: CollectionReference<T>, data: Omit<T, "id" | "createdAt" | "userId">, userId: string) => {
    return await addDoc(collectionRef, {
        ...data,
        userId,
        createdAt: serverTimestamp(),
    } as unknown as T);
};

export const updateDocument = async <T>(collectionName: string, id: string, data: Partial<T>) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data as DocumentData);
};

export const deleteDocument = async (collectionName: string, id: string) => {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
};

// Specialized fetchers
export const getExpensesByAccount = async (accountId: string) => {
    const q = query(expensesCollection, where('accountId', '==', accountId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const getExpensesByCategory = async (categoryId: string) => {
    const q = query(expensesCollection, where('categoryId', '==', categoryId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};
