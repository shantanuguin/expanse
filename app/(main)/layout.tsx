"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CurrencySelector } from "@/components/features/currency-selector";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
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
            <Sidebar />

            {/* ─── Main Content ─── */}
            <div className="flex flex-col flex-1">
                {/* Top header bar */}
                <header className="flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-md px-5 lg:px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="md:hidden flex items-center gap-2 font-heading text-lg">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
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

                {/* ─── Mobile Bottom Nav ─── */}
                <MobileNav />
            </div>
        </div>
    );
}
