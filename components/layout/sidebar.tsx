"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { allNavItems } from "./nav-items";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden w-64 border-r bg-muted/30 md:block">
            <div className="flex h-full max-h-screen flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/dashboard" className="flex items-center gap-2.5 font-heading text-lg">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
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
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("h-[18px] w-[18px]", pathname === item.href && "text-primary")} />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </aside>
    );
}
