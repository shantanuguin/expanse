"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { navLinks } from "./nav-links";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden border-r bg-background md:block w-64 flex-col h-screen sticky top-0">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <span className="">Expanse</span>
                </Link>
            </div>
            <ScrollArea className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4 gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                buttonVariants({ variant: link.href === pathname ? "secondary" : "ghost", size: "sm" }),
                                "justify-start gap-3 px-3",
                                link.href === pathname && "bg-muted text-primary"
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.title}
                        </Link>
                    ))}
                </nav>
            </ScrollArea>
            <div className="mt-auto p-4 border-t">
                <div className="text-xs text-muted-foreground">
                    &copy; 2026 Expanse
                </div>
            </div>
        </div>
    );
}
