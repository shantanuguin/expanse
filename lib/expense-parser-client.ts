import { ParsedExpense, FieldConfidence } from '@/lib/expense-parser';
import * as chrono from 'chrono-node';
import Fuse from 'fuse.js';

/* ── Parse expense text using regex/chrono/fuse (Free & Open Source) ── */
export function parseExpenseText(text: string, categories: { id: string; name: string }[]): ParsedExpense {
    const textLower = text.toLowerCase();

    // Default values
    let amount = 0;
    let currency = "USD";
    let date = new Date().toISOString();
    let categoryName = "";
    let description = text;
    let merchant = "";
    let type: "expense" | "income" = "expense";
    const confidence: FieldConfidence = {
        amount: "none",
        currency: "none",
        date: "none",
        category: "none",
        merchant: "none",
        description: "high",
    };

    // ── 1. Type Detection (Expense vs Income) ──
    if (/\b(income|salary|deposit|received|got paid)\b/i.test(textLower)) {
        type = "income";
    }

    // ── 2. Amount Extraction (Regex) ──
    // Matches: $12.34, 12.34 USD, 12 dollars, 12
    const amountRegex = /(\$|USD|JOD|INR)?\s?(\d+(?:\.\d{1,2})?)\s?(USD|JOD|INR|dollars|bucks)?/i;
    const amountMatch = text.match(amountRegex);
    if (amountMatch) {
        const valStr = amountMatch[2];
        const val = parseFloat(valStr);
        if (!isNaN(val)) {
            amount = val;
            confidence.amount = "high";

            const cur1 = amountMatch[1];
            const cur3 = amountMatch[3];
            if (cur1 === "JOD" || cur3 === "JOD") currency = "JOD";
            else if (cur1 === "INR" || cur3 === "INR") currency = "INR";
            else currency = "USD"; // default

            if (cur1 || cur3) confidence.currency = "high";
        }
    }

    // ── 3. Date Parsing (chrono-node) ──
    const parsedDate = chrono.parseDate(text);
    if (parsedDate) {
        date = parsedDate.toISOString();
        confidence.date = "high";
    }

    // ── 4. Category Matching (Fuse.js) ──
    // Create Fuse instance once (or optimize later)
    if (categories.length > 0) {
        const fuse = new Fuse(categories, {
            keys: ['name'],
            threshold: 0.4, // lower is stricter
        });

        let found = false;
        // Simple heuristic: check if category name exists in text
        for (const cat of categories) {
            if (textLower.includes(cat.name.toLowerCase())) {
                categoryName = cat.name;
                confidence.category = "high";
                found = true;
                break;
            }
        }

        // If not found, use Fuse on the whole text (might be noisy)
        if (!found) {
            const result = fuse.search(text);
            if (result.length > 0) {
                categoryName = result[0].item.name;
                confidence.category = "low"; // fuzzy match
            }
        }
    }

    // ── 5. Merchant Extraction (Heuristic) ──
    // "at Starbucks", "from Uber"
    const merchantRegex = /\b(at|from|to)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/;
    const merchantMatch = text.match(merchantRegex);
    if (merchantMatch) {
        merchant = merchantMatch[2];
        confidence.merchant = "medium";
    }

    // ── 6. Clean Description ──
    // Simple cleanup
    description = text.trim();

    return {
        amount,
        currency,
        category: categoryName, // This is the name, caller maps to ID
        categoryName,
        date,
        merchant,
        description,
        type,
        confidence,
    };
}
