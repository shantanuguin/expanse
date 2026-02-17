import { Currency } from "@/types";
import * as chrono from "chrono-node";
import Fuse from "fuse.js";

/* ── Confidence levels for each parsed field ── */
export type FieldConfidence = "high" | "medium" | "low" | "none";

export interface ParsedExpense {
    type?: "income" | "expense";
    amount?: number;
    currency?: Currency;
    description?: string;
    merchant?: string;
    date?: Date;
    categoryId?: string;
    categoryName?: string;
    /* Per-field parsing confidence */
    confidence: {
        amount: FieldConfidence;
        currency: FieldConfidence;
        date: FieldConfidence;
        merchant: FieldConfidence;
        category: FieldConfidence;
        description: FieldConfidence;
    };
}

interface CategoryOption {
    id: string;
    name: string;
}

/* ── Category keyword map for heuristic matching ── */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    food: ["food", "pizza", "burger", "lunch", "dinner", "breakfast", "meal", "restaurant", "eat", "eating", "groceries", "grocery", "snack", "coffee", "cafe"],
    transport: ["uber", "taxi", "cab", "bus", "train", "metro", "gas", "fuel", "petrol", "parking", "ride", "lyft", "careem", "transport"],
    entertainment: ["movie", "cinema", "netflix", "spotify", "game", "concert", "party", "bar", "club", "fun", "music"],
    shopping: ["shopping", "clothes", "shoes", "amazon", "store", "mall", "buy", "bought", "purchase"],
    health: ["doctor", "pharmacy", "medicine", "gym", "fitness", "hospital", "health", "dental", "dentist"],
    bills: ["bill", "electric", "water", "internet", "phone", "rent", "subscription", "insurance"],
    education: ["book", "course", "tuition", "school", "university", "class", "study", "learning"],
    travel: ["flight", "hotel", "airbnb", "vacation", "trip", "travel", "booking"],
};

/* ── Income indicator words ── */
const INCOME_WORDS = ["salary", "earned", "received", "income", "paid me", "got paid", "payment received", "freelance", "bonus", "refund"];

/**
 * Enhanced expense text parser.
 * Uses chrono-node for natural date detection and fuse.js for fuzzy category matching.
 */
export function parseExpenseText(
    text: string,
    categories: CategoryOption[] = []
): ParsedExpense {
    const result: ParsedExpense = {
        confidence: {
            amount: "none",
            currency: "none",
            date: "none",
            merchant: "none",
            category: "none",
            description: "none",
        },
    };

    const lowerText = text.toLowerCase();

    /* ── 1. Detect income vs expense ── */
    const isIncome = INCOME_WORDS.some((w) => lowerText.includes(w));
    result.type = isIncome ? "income" : "expense";

    /* ── 2. Extract Amount + Currency ── */
    // Patterns: "$25", "25 dollars", "25.50 JOD", "₹500", "JD 10"
    const amountRegex =
        /(\$|€|£|¥|₹|JD)?\s?(\d{1,}(?:[,]\d{3})*(?:\.\d{1,2})?)\s?(dollars?|euros?|pounds?|cents?|usd|jod|inr|rupees?|dinars?)?/gi;

    let bestAmount: number | undefined;
    let bestCurrency: Currency | undefined;
    let amountConf: FieldConfidence = "none";
    let currencyConf: FieldConfidence = "none";

    let match;
    while ((match = amountRegex.exec(text)) !== null) {
        const rawNum = match[2].replace(/,/g, "");
        const num = parseFloat(rawNum);
        if (isNaN(num) || num === 0) continue;

        bestAmount = num;
        amountConf = "high";

        const symbol = match[1];
        const word = match[3]?.toLowerCase();

        if (symbol === "$" || word === "dollar" || word === "dollars" || word === "usd") {
            bestCurrency = "USD";
            currencyConf = "high";
        } else if (symbol === "JD" || word === "jod" || word === "dinar" || word === "dinars") {
            bestCurrency = "JOD";
            currencyConf = "high";
        } else if (symbol === "₹" || word === "inr" || word === "rupee" || word === "rupees") {
            bestCurrency = "INR";
            currencyConf = "high";
        } else if (symbol || word) {
            // Unrecognised symbol/word → default to USD, medium confidence
            bestCurrency = "USD";
            currencyConf = "medium";
        } else {
            // No explicit currency → default to USD, low confidence
            bestCurrency = "USD";
            currencyConf = "low";
        }

        break; // take the first valid amount
    }

    if (bestAmount !== undefined) {
        result.amount = bestAmount;
        result.confidence.amount = amountConf;
    }
    if (bestCurrency) {
        result.currency = bestCurrency;
        result.confidence.currency = currencyConf;
    }

    /* ── 3. Extract Date with chrono-node ── */
    try {
        const parsed = chrono.parse(text);
        if (parsed.length > 0) {
            result.date = parsed[0].start.date();
            // If chrono found a very specific component (day), high confidence
            const comps = parsed[0].start;
            if (comps.isCertain("day")) {
                result.confidence.date = "high";
            } else {
                result.confidence.date = "medium";
            }
        }
    } catch {
        // fallback: basic yesterday/today
        if (lowerText.includes("yesterday")) {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            result.date = d;
            result.confidence.date = "high";
        } else if (lowerText.includes("today")) {
            result.date = new Date();
            result.confidence.date = "high";
        }
    }

    /* ── 4. Extract Merchant ("at X", "from X") ── */
    const merchantRegex = /\b(?:at|from)\s+([A-Z][a-zA-Z']+(?:\s[A-Z][a-zA-Z']+)*)/g;
    const merchantMatch = merchantRegex.exec(text);
    if (merchantMatch) {
        result.merchant = merchantMatch[1];
        result.confidence.merchant = "high";
    }

    /* ── 5. Fuzzy category matching ── */
    if (categories.length > 0) {
        // First try keyword match
        let matchedCategoryId: string | undefined;
        let catConf: FieldConfidence = "none";

        for (const [, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            const hit = keywords.find((kw) => lowerText.includes(kw));
            if (hit) {
                // Find matching category from user's list using fuse.js
                const fuse = new Fuse(categories, {
                    keys: ["name"],
                    threshold: 0.4,
                    includeScore: true,
                });
                // Try the keyword group name first, then the hit word
                for (const [groupName] of Object.entries(CATEGORY_KEYWORDS)) {
                    if (!CATEGORY_KEYWORDS[groupName].includes(hit)) continue;
                    const fuseResult = fuse.search(groupName);
                    if (fuseResult.length > 0) {
                        matchedCategoryId = fuseResult[0].item.id;
                        result.categoryName = fuseResult[0].item.name;
                        catConf = (fuseResult[0].score ?? 1) < 0.2 ? "high" : "medium";
                        break;
                    }
                }
                if (matchedCategoryId) break;
            }
        }

        // If keyword match failed, try fuzzy matching the whole text
        if (!matchedCategoryId) {
            const fuse = new Fuse(categories, {
                keys: ["name"],
                threshold: 0.6,
                includeScore: true,
            });
            // Try each word in the text
            const words = lowerText.split(/\s+/);
            for (const word of words) {
                if (word.length < 3) continue;
                const fuseResult = fuse.search(word);
                if (fuseResult.length > 0 && (fuseResult[0].score ?? 1) < 0.4) {
                    matchedCategoryId = fuseResult[0].item.id;
                    result.categoryName = fuseResult[0].item.name;
                    catConf = "low";
                    break;
                }
            }
        }

        if (matchedCategoryId) {
            result.categoryId = matchedCategoryId;
            result.confidence.category = catConf;
        }
    }

    /* ── 6. Build description ── */
    // Use the full text but clean up parsed components
    let desc = text.trim();
    // Remove amount/currency patterns for a cleaner description
    desc = desc
        .replace(/\$?\s?\d+(?:\.\d{1,2})?\s?(?:dollars?|usd|jod|inr|rupees?|dinars?)?/gi, "")
        .replace(/\b(?:yesterday|today|tomorrow|last\s+\w+|this\s+\w+)\b/gi, "")
        .replace(/\b(?:at|from)\s+[A-Z][a-zA-Z']+(?:\s[A-Z][a-zA-Z']+)*/g, "")
        .replace(/\b(?:spent|paid|bought|got|received|earned)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();

    if (desc) {
        // Capitalize first letter
        result.description = desc.charAt(0).toUpperCase() + desc.slice(1);
        result.confidence.description = desc.length > 2 ? "medium" : "low";
    } else {
        result.description = text.trim();
        result.confidence.description = "low";
    }

    return result;
}
