"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MoreHorizontal, X } from "lucide-react";
import { useState } from "react";
import { mobilePrimaryItems, mobileMoreItems } from "./nav-items";

export function MobileNav() {
    const pathname = usePathname();
    const [moreOpen, setMoreOpen] = useState(false);

    const isMoreActive = mobileMoreItems.some((item) => pathname === item.href);

    return (
        <>
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
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const isSpecial = "special" in item && (item as any).special;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 py-2.5 relative flex-1 transition-colors",
                                    isSpecial && "flex-none w-16",
                                    isActive && !isSpecial
                                        ? "text-primary"
                                        : !isSpecial ? "text-muted-foreground" : ""
                                )}
                            >
                                {isSpecial ? (
                                    <div className="flex items-center justify-center w-13 h-13 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 -mt-5">
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                ) : (
                                    <>
                                        <item.icon className={cn("h-[22px] w-[22px]", isActive && "text-primary")} />
                                        <span className={cn(
                                            "text-[10px] leading-tight",
                                            isActive ? "font-bold text-primary" : "font-medium"
                                        )}>
                                            {item.label}
                                        </span>
                                        {isActive && (
                                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-primary" />
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
                                ? "text-primary"
                                : "text-muted-foreground"
                        )}
                    >
                        <MoreHorizontal className={cn(
                            "h-[22px] w-[22px]",
                            (isMoreActive || moreOpen) && "text-primary"
                        )} />
                        <span className={cn(
                            "text-[10px] leading-tight",
                            isMoreActive || moreOpen ? "font-bold text-primary" : "font-medium"
                        )}>
                            More
                        </span>
                        {isMoreActive && (
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-primary" />
                        )}
                    </button>
                </div>
            </nav>
        </>
    );
}
