"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, Receipt, PlusCircle, PieChart,
    RefreshCcw, Activity, Target, BarChart3, Wallet
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CurrencySelector } from "@/components/features/currency-selector";

/* ── All nav items (sidebar uses all; mobile uses a subset) ── */
const allNavItems = [
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

/* Mobile bottom bar only shows the 5 most essential items */
const mobileNavItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/expenses", label: "Expenses", icon: Receipt },
    { href: "/add", label: "Add", icon: PlusCircle, special: true },
    { href: "/budgets", label: "Budgets", icon: PieChart },
    { href: "/reports", label: "Reports", icon: BarChart3 },
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
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading…</div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* ─── Desktop Sidebar ─── */}
            <aside className="hidden w-64 border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F54142]" />
                            <span>Expanse</span>
                        </Link>
                    </div>
                    <div className="flex-1">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-0.5">
                            {allNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                        pathname === item.href
                                            ? "bg-[#F54142]/10 text-[#F54142] font-semibold"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4", pathname === item.href && "text-[#F54142]")} />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </aside>

            {/* ─── Main content area ─── */}
            <div className="flex flex-col flex-1">
                {/* Top header bar */}
                <header className="flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="md:hidden flex items-center gap-2 font-semibold">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F54142]" />
                            <span>Expanse</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <CurrencySelector />
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-6">
                    {children}
                </main>

                {/* ─── Mobile Bottom Nav (5 items only) ─── */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md md:hidden safe-area-bottom">
                    <div className="flex justify-around items-end h-16 px-2">
                        {mobileNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            const isSpecial = "special" in item && item.special;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-0.5 py-1.5 relative",
                                        isSpecial ? "w-14" : "flex-1",
                                        isActive && !isSpecial
                                            ? "text-[#F54142]"
                                            : !isSpecial ? "text-muted-foreground" : ""
                                    )}
                                >
                                    {isSpecial ? (
                                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F54142] text-white shadow-lg shadow-[#F54142]/25 -mt-4">
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                    ) : (
                                        <>
                                            <item.icon className={cn("h-5 w-5", isActive && "text-[#F54142]")} />
                                            <span className={cn(
                                                "text-[10px] leading-tight",
                                                isActive ? "font-semibold text-[#F54142]" : "font-medium"
                                            )}>
                                                {item.label}
                                            </span>
                                            {isActive && (
                                                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#F54142]" />
                                            )}
                                        </>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </div>
    );
}
