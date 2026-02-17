"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Currency } from "@/types";

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    convert: (amount: number, from: Currency, to: Currency) => number;
    format: (amount: number, currency?: Currency) => string;
    rates: Record<string, number>;
    loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
    currency: "USD",
    setCurrency: () => { },
    convert: () => 0,
    format: () => "",
    rates: {},
    loading: true,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<Currency>("USD");
    const [rates, setRates] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch rates for base USD (or generic base)
        const fetchRates = async () => {
            try {
                const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
                const data = await res.json();
                setRates(data.rates);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch exchange rates", error);
                setLoading(false);
            }
        };

        fetchRates();
    }, []);

    const convert = (amount: number, from: Currency, to: Currency): number => {
        if (!rates[from] || !rates[to]) return amount; // Fallback
        // Convert to USD first (since rates are relative to base, usually USD in this API check)
        // Actually api.exchangerate-api.com/v4/latest/USD returns rates relative to USD.
        // So: Amount (From) / Rate(From) * Rate(To)
        const amountInBase = amount / rates[from];
        return amountInBase * rates[to];
    };

    const format = (amount: number, targetCurrency: Currency = currency): string => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: targetCurrency,
        }).format(amount);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, convert, format, rates, loading }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export const useCurrency = () => useContext(CurrencyContext);
