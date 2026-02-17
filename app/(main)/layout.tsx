"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, Receipt, PlusCircle, PieChart,
    RefreshCcw, Activity, Target, BarChart3, Wallet,
    MoreHorizontal, X
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CurrencySelector } from "@/components/features/currency-selector";

/* ── All nav items ── */
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

/* ── Mobile: primary bar items ── */
const mobilePrimaryItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/expenses", label: "Expenses", icon: Receipt },
    { href: "/add", label: "Add", icon: PlusCircle, special: true },
    { href: "/reports", label: "Reports", icon: BarChart3 },
];

/* ── Mobile: "More" drawer items ── */
const mobileMoreItems = [
    { href: "/budgets", label: "Budgets", icon: PieChart },
    { href: "/recurring", label: "Recurring", icon: RefreshCcw },
    { href: "/debts", label: "Debts", icon: Activity },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/accounts", label: "Accounts", icon: Wallet },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const router = useRouter();
    const [moreOpen, setMoreOpen] = useState(false);

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

    const isMoreActive = mobileMoreItems.some((item) => pathname === item.href);

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* ─── Desktop Sidebar ─── */}
            <aside className="hidden w-64 border-r bg-muted/30 md:block">
                <div className="flex h-full max-h-screen flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center border-b px-6">
                        <Link href="/dashboard" className="flex items-center gap-2.5 font-heading text-lg">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F54142]" />
                            Expanse
                        </Link>
                    </div>

                    {/* Nav items */}
                    <div className="flex-1 overflow-y-auto py-4">
                        <nav className="flex flex-col gap-1 px-3">
                            {allNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150",
                                        pathname === item.href
                                            ? "bg-[#F54142]/10 text-[#F54142] font-semibold"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className={cn("h-[18px] w-[18px]", pathname === item.href && "text-[#F54142]")} />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <div className="flex flex-col flex-1">
                {/* Top header bar */}
                <header className="flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-md px-5 lg:px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="md:hidden flex items-center gap-2 font-heading text-lg">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F54142]" />
                            Expanse
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <CurrencySelector />
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-10 overflow-y-auto pb-28 md:pb-8">
                    {children}
                </main>

                {/* ─── Mobile "More" Drawer ─── */}
                {moreOpen && (
                    <div className="fixed inset-0 z-[60] md:hidden" onClick={() => setMoreOpen(false)}>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <div
                            className="absolute bottom-20 left-4 right-4 bg-background border rounded-3xl shadow-2xl p-3 animate-in slide-in-from-bottom-4 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-4 py-2.5 border-b mb-2">
                                <span className="text-sm font-heading">More</span>
                                <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-full hover:bg-muted">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 p-1">
                                {mobileMoreItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMoreOpen(false)}
                                            className={cn(
                                                "flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-colors",
                                                isActive
                                                    ? "bg-[#F54142]/10 text-[#F54142]"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className={cn("h-5 w-5", isActive && "text-[#F54142]")} />
                                            <span className={cn(
                                                "text-[11px] leading-tight",
                                                isActive ? "font-semibold" : "font-medium"
                                            )}>
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Mobile Bottom Nav ─── */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-xl md:hidden safe-area-bottom">
                    <div className="flex items-end h-[72px] px-2">
                        {mobilePrimaryItems.map((item) => {
                            const isActive = pathname === item.href;
                            const isSpecial = "special" in item && item.special;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1 py-2.5 relative flex-1 transition-colors",
                                        isSpecial && "flex-none w-16",
                                        isActive && !isSpecial
                                            ? "text-[#F54142]"
                                            : !isSpecial ? "text-muted-foreground" : ""
                                    )}
                                >
                                    {isSpecial ? (
                                        <div className="flex items-center justify-center w-13 h-13 rounded-2xl bg-[#F54142] text-white shadow-lg shadow-[#F54142]/25 -mt-5">
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                    ) : (
                                        <>
                                            <item.icon className={cn("h-[22px] w-[22px]", isActive && "text-[#F54142]")} />
                                            <span className={cn(
                                                "text-[10px] leading-tight",
                                                isActive ? "font-bold text-[#F54142]" : "font-medium"
                                            )}>
                                                {item.label}
                                            </span>
                                            {isActive && (
                                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-[#F54142]" />
                                            )}
                                        </>
                                    )}
                                </Link>
                            );
                        })}

                        {/* "More" button */}
                        <button
                            type="button"
                            onClick={() => setMoreOpen(!moreOpen)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 py-2.5 flex-1 transition-colors",
                                isMoreActive || moreOpen
                                    ? "text-[#F54142]"
                                    : "text-muted-foreground"
                            )}
                        >
                            <MoreHorizontal className={cn(
                                "h-[22px] w-[22px]",
                                (isMoreActive || moreOpen) && "text-[#F54142]"
                            )} />
                            <span className={cn(
                                "text-[10px] leading-tight",
                                isMoreActive || moreOpen ? "font-bold text-[#F54142]" : "font-medium"
                            )}>
                                More
                            </span>
                            {isMoreActive && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-[#F54142]" />
                            )}
                        </button>
                    </div>
                </nav>
            </div>
        </div>
    );
}
