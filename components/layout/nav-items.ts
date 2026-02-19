import {
    LayoutDashboard, Receipt, PlusCircle, PieChart,
    RefreshCcw, Activity, Target, BarChart3, Wallet
} from "lucide-react";

export const allNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/expenses", label: "Expenses", icon: Receipt },
    { href: "/budgets", label: "Budgets", icon: PieChart },
    { href: "/recurring", label: "Recurring", icon: RefreshCcw },
    { href: "/debts", label: "Debts", icon: Activity },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/accounts", label: "Accounts", icon: Wallet },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/add", label: "Add", icon: PlusCircle },
];

export const mobilePrimaryItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/expenses", label: "Expenses", icon: Receipt },
    { href: "/add", label: "Add", icon: PlusCircle, special: true },
    { href: "/reports", label: "Reports", icon: BarChart3 },
];

export const mobileMoreItems = [
    { href: "/budgets", label: "Budgets", icon: PieChart },
    { href: "/recurring", label: "Recurring", icon: RefreshCcw },
    { href: "/debts", label: "Debts", icon: Activity },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/accounts", label: "Accounts", icon: Wallet },
];
