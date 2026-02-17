"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Expense } from "@/types";
import { format } from "date-fns";

interface ExportButtonProps {
    data: Expense[];
    filename?: string;
    categoryMap?: Record<string, string>;
    accountMap?: Record<string, string>;
}

export function ExportButton({ data, filename = "expenses.csv", categoryMap, accountMap }: ExportButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) {
            alert("No data to export");
            return;
        }

        // Define CSV headers
        const headers = ["Date", "Description", "Amount", "Currency", "Category", "Account", "Type", "Tags"];

        // Map data to rows
        const rows = data.map(item => {
            const category = categoryMap ? (categoryMap[item.categoryId] || item.categoryId) : item.categoryId;
            const account = accountMap ? (accountMap[item.accountId] || item.accountId) : item.accountId;

            return [
                format(new Date(item.date), "yyyy-MM-dd"),
                `"${item.description?.replace(/"/g, '""') || ""}"`, // Escape quotes
                item.amount,
                item.currency,
                `"${category}"`,
                `"${account}"`,
                item.type,
                `"${(item.tags || []).join(",")}"`
            ];
        });

        // Construct CSV content
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        // Create blob and download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
        </Button>
    );
}
