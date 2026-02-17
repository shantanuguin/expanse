"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Receipt, PlusCircle, PieChart, RefreshCcw, Activity, Target, BarChart3 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CurrencySelector } from "@/components/features/currency-selector";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/expenses", label: "Expenses", icon: Receipt },
    { href: "/budgets", label: "Budgets", icon: PieChart },
    { href: "/recurring", label: "Recurring", icon: RefreshCcw },
    { href: "/debts", label: "Debts", icon: Activity },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/accounts", label: "Accounts", icon: Receipt },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/add", label: "Add", icon: PlusCircle },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                            <span className="">Expense Tracker</span>
                        </Link>
                    </div>
                    <div className="flex-1">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                        pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </aside>

            {/* Mobile Content & Bottom Nav */}
            <div className="flex flex-col flex-1">


                <header className="flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="md:hidden flex items-center gap-2 font-semibold">
                            <span>Expense Tracker</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <CurrencySelector />
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto mb-16 md:mb-0">
                    {children}
                </main>

                {/* Mobile Bottom Nav */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
                    <div className="flex justify-around items-center h-16">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full gap-1 text-xs",
                                    pathname === item.href ? "text-primary font-medium" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </nav>
            </div>
        </div>
    );
}
