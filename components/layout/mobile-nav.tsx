"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navLinks } from "./nav-links";
import { useState } from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

export function MobileNav() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-64">
                <VisuallyHidden.Root>
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription>Navigation Menu</SheetDescription>
                </VisuallyHidden.Root>
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => setOpen(false)}>
                        <span>Expanse</span>
                    </Link>
                </div>
                <nav className="grid gap-1 px-2 text-lg font-medium lg:px-4 py-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                link.href === pathname
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <link.icon className="h-5 w-5" />
                            {link.title}
                        </Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
