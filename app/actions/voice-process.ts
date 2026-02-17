"use server";

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/* ── Structured Output Schema ── */
const ExpenseExtractionSchema = z.object({
    amount: z.number().describe("The numeric amount of the expense."),
    currency: z.string().describe("The 3-letter currency code (e.g. USD, INR, JOD). Default to user's local if unsure, or USD."),
    category: z.string().describe("The category best matching the expense. Options: Food, Transport, Entertainment, Shopping, Health, Bills, Education, Travel, Housing, Groceries."),
    date: z.string().describe("The date of the expense in YYYY-MM-DD format. If 'yesterday' or 'today' is mentioned, calculate it relative to now."),
    merchant: z.string().describe("The place or person paid (e.g. Starbucks, Uber, John)."),
    description: z.string().describe("A brief, clean description of what was purchased."),
    type: z.enum(["expense", "income"]).describe("Whether this is an expense or income."),
});

export type ExtractedExpense = z.infer<typeof ExpenseExtractionSchema>;

export async function processVoiceExpense(formData: FormData): Promise<{ success: boolean; data?: ExtractedExpense; text?: string; error?: string }> {
    try {
        const audioFile = formData.get("audio") as File;
        if (!audioFile) {
            return { success: false, error: "No audio file provided." };
        }

        /* ── 1. Transcribe with Whisper ── */
        // We need to pass a File-like object. 
        // FormData entry is already a File, so we can pass it directly if utilizing built-in fetch, 
        // but OpenAI node SDK expects a specifically formatted input or file path.
        // We will convert it to a standard File object properly if needed, but SDK usually handles File objects from formData in server actions environments (Edge/Node).

        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "en",
            prompt: "The user is dictating an expense or income. Context: Personal Finance. Currencies: JOD, USD, INR.",
        });

        const text = transcription.text;
        if (!text || text.length < 2) {
            return { success: false, error: "No speech detected." };
        }

        console.log("Transcribed:", text);

        /* ── 2. Parse with GPT-4o-mini ── */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const completion = await (openai as any).beta.chat.completions.parse({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful financial assistant. Extract expense details from the user's speech. Current date: " + new Date().toISOString() },
                { role: "user", content: text },
            ],
            response_format: zodResponseFormat(ExpenseExtractionSchema, "expense_extraction"),
        });

        const extracted = completion.choices[0].message.parsed;

        if (!extracted) {
            return { success: false, error: "Failed to parse expense details." };
        }

        return { success: true, data: extracted, text };

    } catch (e) {
        console.error("Voice processing error:", e);
        return { success: false, error: "Server processing failed." };
    }
}
