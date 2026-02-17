import {
    LayoutDashboard,
    Receipt,
    CreditCard,
    PiggyBank,
    BarChart3,
    Settings,
    Repeat
} from 'lucide-react';

export const navLinks = [
    {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
    },
    {
        title: 'Expenses',
        href: '/expenses',
        icon: Receipt,
    },
    {
        title: 'Recurring',
        href: '/recurring',
        icon: Repeat,
    },
    {
        title: 'Accounts',
        href: '/accounts',
        icon: CreditCard,
    },
    {
        title: 'Budgets',
        href: '/budgets',
        icon: PiggyBank,
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: BarChart3,
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
    },
];
