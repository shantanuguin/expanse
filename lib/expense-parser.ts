export interface ParsedExpense {
    amount?: number;
    currency?: string;
    description?: string;
    merchant?: string;
    date?: Date;
}

export function parseExpenseText(text: string): ParsedExpense {
    const result: ParsedExpense = {};

    // 1. Extract Amount and Currency
    // Look for patterns like "$25", "25 dollars", "25 EUR", "25"
    // Regex for amount: \d+(\.\d{1,2})?
    // Regex for currency symbols: [$€£¥]

    const amountRegex = /(\$|€|£|¥)?\s?(\d+(\.\d{1,2})?)\s?(dollars|euros|pounds|cent|cents|usd|eur|gbp)?/i;
    const amountMatch = text.match(amountRegex);

    if (amountMatch) {
        // group 2 is amount
        result.amount = parseFloat(amountMatch[2]);

        // Try to guess currency
        const symbol = amountMatch[1];
        const word = amountMatch[4]?.toLowerCase();

        if (symbol === '$' || word === 'dollars' || word === 'usd') result.currency = 'USD';
        else if (symbol === '€' || word === 'euros' || word === 'eur') result.currency = 'EUR';
        else if (symbol === '£' || word === 'pounds' || word === 'gbp') result.currency = 'GBP';
        else result.currency = 'USD'; // Default
    }

    // 2. Extract Merchant (basic heuristic: "at [Merchant]")
    const merchantRegex = /\b(at|from)\s+([A-Z][a-z]+(\s[A-Z][a-z]+)*)/;
    const merchantMatch = text.match(merchantRegex);
    if (merchantMatch) {
        result.merchant = merchantMatch[2];
    }

    // 3. Extract Category (basic keyword matching - can be improved)
    // keywords: food, pizza, burger, grocery, uber, taxi, bus, movie, cinema...
    // For now we just put the whole text as description if parsing fails
    result.description = text; // Default description is the full text

    // 4. Extract Date (basic: "yesterday", "today", "tomorrow")
    const lowerText = text.toLowerCase();
    if (lowerText.includes("yesterday")) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        result.date = d;
    } else if (lowerText.includes("today")) {
        result.date = new Date();
    }

    return result;
}
