"use client";

import { useCurrency } from "@/components/providers/currency-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CurrencySelector() {
    const { currency, setCurrency } = useCurrency();

    // Common currencies to show first or just show all common ones
    const commonCurrencies = ["USD", "JOD", "INR"];

    return (
        <Select value={currency} onValueChange={(val) => setCurrency(val as import("@/types").Currency)}>
            <SelectTrigger className="w-[80px] md:w-[100px]">
                <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
                {commonCurrencies.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
