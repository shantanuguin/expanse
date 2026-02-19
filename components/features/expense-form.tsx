"use client";

import "@/app/voice-expense.css";

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    CalendarIcon, Mic, Pencil, Check, RotateCcw,
    ArrowRight, Keyboard, Download
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

import { expenseSchema, ExpenseFormValues } from "@/schema/expense";
import { addDocument, expensesCollection, categoriesCollection } from "@/lib/firestore-service";
import { useCollection } from "@/hooks/use-firestore";
import { Account, Category, Currency } from "@/types";

import { ParsedExpense, FieldConfidence } from "@/lib/expense-parser";
import { parseExpenseText } from "@/lib/expense-parser-client";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import { useAuth } from "@/components/providers/auth-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { Loader2 } from "lucide-react";

/* ────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */
type AppMode = "voice" | "manual";
type VoicePhase = "idle" | "listening" | "review";

/* ────────────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────────────── */
export function ExpenseForm() {
    const { user } = useAuth();
    const { currency } = useCurrency();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mode, setMode] = useState<AppMode>("voice");
    const [voicePhase, setVoicePhase] = useState<VoicePhase>("idle");
    const [parsed, setParsed] = useState<ParsedExpense | null>(null);
    const [transcript, setTranscript] = useState<string>("");
    const [editingField, setEditingField] = useState<string | null>(null);

    const { data: categories, loading: categoriesLoading } = useCollection<Category>("categories", user?.uid);
    const { data: accounts } = useCollection<Account>("accounts", user?.uid);

    // ── Web Speech API State ──
    const [isRecording, setIsRecording] = useState(false);
    const [recorderError, setRecorderError] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = "en-US";
                recognitionRef.current = recognition;
            } else {
                setRecorderError("Voice input not supported in this browser.");
            }
        }
    }, []);

    const form = useForm<ExpenseFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(expenseSchema) as any,
        defaultValues: {
            type: "expense",
            amount: 0,
            currency,
            description: "",
            date: new Date(),
            merchant: "",
            notes: "",
            categoryId: "",
            accountId: "",
            tags: "",
        },
    });

    // ── Seed Categories ──
    const handleSeedCategories = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            for (const cat of DEFAULT_CATEGORIES) {
                await addDocument(categoriesCollection, cat, user.uid);
            }
            toast.success("Default categories added!");
        } catch (error) {
            console.error("Failed to seed categories", error);
            toast.error("Failed to add categories.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const handleStopListening = useCallback((finalText: string) => {
        stopListening();
        if (!finalText) {
             setVoicePhase("idle");
             return;
        }

        // Process locally
        const result = parseExpenseText(finalText, categories);

        setParsed(result);
        setVoicePhase("review");

        // Fill form
        if (result.type) form.setValue("type", result.type);
        if (result.amount) form.setValue("amount", result.amount);
        if (result.currency) form.setValue("currency", result.currency as Currency);
        if (result.description) form.setValue("description", result.description);
        if (result.merchant) form.setValue("merchant", result.merchant);
        if (result.date) form.setValue("date", new Date(result.date));

        // Try to find category ID
        const cat = categories.find(c => c.name.toLowerCase() === result.categoryName?.toLowerCase());
        if (cat) form.setValue("categoryId", cat.id);

    }, [categories, form, stopListening]);

    /* ── Handlers ── */
    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            toast.error("Speech recognition not supported.");
            return;
        }
        setRecorderError(null);
        setTranscript("");
        setIsRecording(true);
        setVoicePhase("listening");

        recognitionRef.current.start();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = "";
            let interimTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            const currentText = finalTranscript || interimTranscript;
            setTranscript(currentText);

            if (finalTranscript) {
                handleStopListening(finalTranscript);
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            if (event.error === "no-speech") {
                 setRecorderError("No speech detected. Try again.");
            } else {
                 setRecorderError("Microphone error: " + event.error);
            }
            setIsRecording(false);
            setVoicePhase("idle");
        };

        recognitionRef.current.onend = () => {
             // If stopped manually, isRecording might be false already.
             // If stopped automatically by silence, we might want to process what we have.
             // But usually onresult handles final transcript.
             if (isRecording) {
                 setIsRecording(false);
             }
        };

    }, [isRecording, handleStopListening]);

    const handleOrbTap = useCallback(() => {
        if (isRecording) {
            stopListening();
            // If we stop manually, we might want to take whatever transcript we have
            if (transcript) {
                handleStopListening(transcript);
            } else {
                setVoicePhase("idle");
            }
        } else {
            setParsed(null);
            form.reset();
            startListening();
        }
    }, [isRecording, stopListening, transcript, form, startListening, handleStopListening]);


    /* ── Handlers ── */
    const handleTryAgain = useCallback(() => {
        setParsed(null);
        setTranscript("");
        form.reset();
        setVoicePhase("idle");
        setTimeout(() => {
            startListening();
        }, 300);
    }, [form, startListening]);

    const handleSwitchMode = useCallback((newMode: AppMode) => {
        if (isRecording) stopListening();
        setMode(newMode);
        if (newMode === "voice") {
            setVoicePhase("idle");
            setParsed(null);
            setTranscript("");
        }
    }, [isRecording, stopListening]);

    async function onSubmit(data: ExpenseFormValues) {
        if (!user) {
            toast.error("You must be logged in.");
            return;
        }
        setIsSubmitting(true);
        try {
            await addDocument(expensesCollection, {
                ...data,
                tags: data.tags
                    ? typeof data.tags === "string" ? data.tags.split(",").map((t) => t.trim()) : data.tags
                    : [],
            }, user.uid);
            form.reset({
                type: data.type,
                amount: 0,
                currency: data.currency,
                description: "",
                date: new Date(),
                merchant: "",
                notes: "",
                categoryId: "",
                accountId: "",
                tags: "",
            });
            toast.success("Transaction saved!");
            // Reset voice mode for next entry
            if (mode === "voice") {
                setParsed(null);
                setTranscript("");
                setVoicePhase("idle");
            }
        } catch (error) {
            console.error("Failed to add transaction", error);
            toast.error("Failed to save. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    // ── Check for empty categories ──
    if (!categoriesLoading && categories.length === 0) {
        return (
             <div className="max-w-lg mx-auto py-10 text-center space-y-4">
                 <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-2xl border border-yellow-200 dark:border-yellow-800">
                     <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                         You don&apos;t have any categories yet.
                     </p>
                     <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                         Add default categories to start tracking your expenses.
                     </p>
                 </div>
                 <Button onClick={handleSeedCategories} disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                     Add Default Categories
                 </Button>
             </div>
        );
    }

    /* ────────────────────────────────────────────
       Render
       ──────────────────────────────────────────── */
    return (
        <div className="max-w-lg mx-auto space-y-5">
            {/* Mode Toggle */}
            <div className="mode-toggle">
                <button
                    type="button"
                    className={mode === "voice" ? "active" : ""}
                    onClick={() => handleSwitchMode("voice")}
                >
                    <Mic className="inline-block h-3.5 w-3.5 mr-1.5" />
                    Voice
                </button>
                <button
                    type="button"
                    className={mode === "manual" ? "active" : ""}
                    onClick={() => handleSwitchMode("manual")}
                >
                    <Keyboard className="inline-block h-3.5 w-3.5 mr-1.5" />
                    Manual
                </button>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <AnimatePresence mode="wait">
                        {mode === "voice" ? (
                            <motion.div
                                key="voice"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <VoiceMode
                                    voicePhase={voicePhase}
                                    isRecording={isRecording}
                                    parsed={parsed}
                                    transcript={transcript}
                                    error={recorderError}
                                    categories={categories}
                                    accounts={accounts}
                                    form={form}
                                    editingField={editingField}
                                    setEditingField={setEditingField}
                                    isSubmitting={isSubmitting}
                                    onOrbTap={handleOrbTap}
                                    onTryAgain={handleTryAgain}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="manual"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ManualMode
                                    form={form}
                                    categories={categories}
                                    accounts={accounts}
                                    isSubmitting={isSubmitting}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </Form>
        </div>
    );
}

/* ════════════════════════════════════════════════════════
   VOICE MODE
   ════════════════════════════════════════════════════════ */
function VoiceMode({
    voicePhase, isRecording,
    parsed, transcript, error,
    categories, accounts, form, editingField, setEditingField,
    isSubmitting, onOrbTap, onTryAgain,
}: {
    voicePhase: VoicePhase;
    isRecording: boolean;
    parsed: ParsedExpense | null;
    transcript: string;
    error: string | null;
    categories: Category[];
    accounts: Account[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: any;
    editingField: string | null;
    setEditingField: (f: string | null) => void;
    isSubmitting: boolean;
    onOrbTap: () => void;
    onTryAgain: () => void;
}) {
    return (
        <div className="space-y-6">
            {/* ── Listening / Idle Phase ── */}
            {(voicePhase === "idle" || voicePhase === "listening") && !parsed && (
                <div className="voice-orb-wrapper">
                    <button
                        type="button"
                        className={cn("voice-orb", isRecording && "listening")}
                        onClick={onOrbTap}
                    >
                        {isRecording ? (
                            <div className="waveform">
                                <div className="waveform-bar" />
                                <div className="waveform-bar" />
                                <div className="waveform-bar" />
                                <div className="waveform-bar" />
                                <div className="waveform-bar" />
                            </div>
                        ) : (
                            <Mic className="h-10 w-10" />
                        )}
                    </button>

                    {/* Status Text */}
                    <div className="voice-transcript-area">
                         {isRecording ? (
                            <>
                                <span className="voice-transcript-interim">Listening... Tap to stop</span>
                                <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto italic">
                                    &quot;{transcript || "..."}&quot;
                                </p>
                            </>
                        ) : (
                            <span className="text-muted-foreground text-sm">Tap microphone to start</span>
                        )}
                    </div>

                    {!isRecording && (
                        <p className="voice-hint">
                            Say something like &quot;Spent 25 dollars on pizza at Dominos yesterday&quot;
                        </p>
                    )}

                    {error && (
                        <p className="text-destructive text-sm">{error}</p>
                    )}
                </div>
            )}

            {/* ── Review Phase: Editable Summary Card ── */}
            {voicePhase === "review" && parsed && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                >
                    {/* Original transcript */}
                    <div className="text-center px-4">
                        <p className="text-sm text-muted-foreground italic">
                            &ldquo;{transcript}&rdquo;
                        </p>
                    </div>

                    {/* Summary Card */}
                    <div className="summary-card">
                        {/* Type */}
                        <SummaryField
                            label="Type"
                            value={form.watch("type") === "income" ? "Income" : "Expense"}
                            confidence="high"
                            isEditing={editingField === "type"}
                            onStartEdit={() => setEditingField("type")}
                            editContent={
                                <div className="flex gap-2 w-full">
                                    <Button
                                        type="button" size="sm" className="flex-1"
                                        variant={form.watch("type") === "expense" ? "default" : "outline"}
                                        onClick={() => { form.setValue("type", "expense"); setEditingField(null); }}
                                    >Expense</Button>
                                    <Button
                                        type="button" size="sm" className="flex-1"
                                        variant={form.watch("type") === "income" ? "default" : "outline"}
                                        onClick={() => { form.setValue("type", "income"); setEditingField(null); }}
                                    >Income</Button>
                                </div>
                            }
                        />

                        {/* Amount + Currency */}
                        <SummaryField
                            label="Amount"
                            value={form.watch("amount") ? `${form.watch("currency")} ${form.watch("amount")}` : ""}
                            confidence={parsed.confidence.amount}
                            isEditing={editingField === "amount"}
                            onStartEdit={() => setEditingField("amount")}
                            editContent={
                                <div className="flex gap-2 w-full">
                                    <Input
                                        type="number" step="0.01" className="flex-1"
                                        defaultValue={form.watch("amount")}
                                        onChange={(e) => form.setValue("amount", parseFloat(e.target.value) || 0)}
                                    />
                                    <Select
                                        defaultValue={form.watch("currency")}
                                        onValueChange={(v) => form.setValue("currency", v)}
                                    >
                                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="JOD">JOD</SelectItem>
                                            <SelectItem value="INR">INR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => setEditingField(null)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            }
                        />

                        {/* Description */}
                        <SummaryField
                            label="What"
                            value={form.watch("description")}
                            confidence={parsed.confidence.description}
                            isEditing={editingField === "description"}
                            onStartEdit={() => setEditingField("description")}
                            editContent={
                                <div className="flex gap-2 w-full">
                                    <Input
                                        defaultValue={form.watch("description")}
                                        onChange={(e) => form.setValue("description", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="button" size="icon" variant="ghost" onClick={() => setEditingField(null)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            }
                        />

                        {/* Category */}
                        <SummaryField
                            label="Category"
                            value={
                                parsed.categoryName ||
                                categories.find((c) => c.id === form.watch("categoryId"))?.name ||
                                ""
                            }
                            confidence={parsed.confidence.category}
                            isEditing={editingField === "category"}
                            onStartEdit={() => setEditingField("category")}
                            editContent={
                                <div className="flex gap-2 w-full items-center">
                                    <Select
                                        defaultValue={form.watch("categoryId")}
                                        onValueChange={(v) => form.setValue("categoryId", v)}
                                    >
                                        <SelectTrigger className="flex-1"><SelectValue placeholder="Pick category" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => setEditingField(null)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            }
                        />

                        {/* Account */}
                        <SummaryField
                            label="Account"
                            value={accounts.find((a) => a.id === form.watch("accountId"))?.name || ""}
                            confidence="none"
                            isEditing={editingField === "account"}
                            onStartEdit={() => setEditingField("account")}
                            editContent={
                                <div className="flex gap-2 w-full items-center">
                                    <Select
                                        defaultValue={form.watch("accountId")}
                                        onValueChange={(v) => form.setValue("accountId", v)}
                                    >
                                        <SelectTrigger className="flex-1"><SelectValue placeholder="Pick account" /></SelectTrigger>
                                        <SelectContent>
                                            {accounts.map((a) => (
                                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => setEditingField(null)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            }
                        />

                        {/* Merchant */}
                        <SummaryField
                            label="Where"
                            value={form.watch("merchant") || ""}
                            confidence={parsed.confidence.merchant}
                            isEditing={editingField === "merchant"}
                            onStartEdit={() => setEditingField("merchant")}
                            editContent={
                                <div className="flex gap-2 w-full">
                                    <Input
                                        defaultValue={form.watch("merchant")}
                                        onChange={(e) => form.setValue("merchant", e.target.value)}
                                        className="flex-1"
                                        placeholder="Merchant name"
                                    />
                                    <Button type="button" size="icon" variant="ghost" onClick={() => setEditingField(null)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            }
                        />

                        {/* Date */}
                        <SummaryField
                            label="When"
                            value={form.watch("date") ? format(form.watch("date"), "PPP") : ""}
                            confidence={parsed.confidence.date}
                            isEditing={editingField === "date"}
                            onStartEdit={() => setEditingField("date")}
                            editContent={
                                <div className="w-full">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left">
                                                {form.watch("date") ? format(form.watch("date"), "PPP") : "Pick a date"}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={form.watch("date")}
                                                onSelect={(d) => { if (d) form.setValue("date", d); setEditingField(null); }}
                                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            }
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <Button
                            type="button" variant="outline" className="flex-1"
                            onClick={onTryAgain}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" /> Try Again
                        </Button>
                        <Button
                            type="submit" className="flex-1 bg-[#F54142] hover:bg-[#d63636]"
                            disabled={isSubmitting || !form.watch("amount")}
                        >
                            {isSubmitting ? "Saving..." : "Confirm & Save"}
                            {!isSubmitting && <ArrowRight className="h-4 w-4 ml-2" />}
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

/* ── Summary Field (tappable row in the card) ── */
function SummaryField({
    label, value, confidence, isEditing,
    onStartEdit, editContent,
}: {
    label: string;
    value: string;
    confidence: FieldConfidence;
    isEditing: boolean;
    onStartEdit: () => void;
    editContent: React.ReactNode;
}) {
    return (
        <div className="summary-field" onClick={!isEditing ? onStartEdit : undefined}>
            <span className="summary-field-label">{label}</span>
            {isEditing ? (
                <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                    {editContent}
                </div>
            ) : (
                <>
                    <span className={cn("summary-field-value", !value && "empty")}>
                        {value || "Tap to set"}
                    </span>
                    <span className={cn("confidence-dot", confidence)} />
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-40" />
                </>
            )}
        </div>
    );
}

/* ════════════════════════════════════════════════════════
   MANUAL MODE  (traditional form + per-field mic icons)
   ════════════════════════════════════════════════════════ */
function ManualMode({
    form, categories, accounts, isSubmitting,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: any;
    categories: Category[];
    accounts: Account[];
    isSubmitting: boolean;
}) {
    return (
        <div className="space-y-5 p-5 md:p-8 bg-card rounded-3xl border card-hover shadow-sm">
            {/* Type toggle */}
            <FormField
                control={form.control}
                name="type"
                render={({ field }: { field: { value: string; onChange: (v: string) => void } }) => (
                    <FormItem className="space-y-2">
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                            <div className="flex gap-3">
                                <Button
                                    type="button" className="flex-1"
                                    variant={field.value === "expense" ? "default" : "outline"}
                                    onClick={() => field.onChange("expense")}
                                >Expense</Button>
                                <Button
                                    type="button" className="flex-1"
                                    variant={field.value === "income" ? "default" : "outline"}
                                    onClick={() => field.onChange("income")}
                                >Income</Button>
                            </div>
                        </FormControl>
                    </FormItem>
                )}
            />

            {/* Amount + Currency */}
            <div className="flex gap-3">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> }) => (
                        <FormItem className="flex-1">
                            <FormLabel className="flex justify-between items-center">
                                Amount
                                <FieldMic onResult={(t) => {
                                    const num = parseFloat(t.replace(/[^0-9.]/g, ""));
                                    if (!isNaN(num)) form.setValue("amount", num);
                                }} />
                            </FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0.00" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }: { field: { value: string; onChange: (v: string) => void } }) => (
                        <FormItem className="w-24">
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Cur" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="JOD">JOD</SelectItem>
                                    <SelectItem value="INR">INR</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
            </div>

            {/* Description */}
            <FormField
                control={form.control}
                name="description"
                render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> }) => (
                    <FormItem>
                        <FormLabel className="flex justify-between items-center">
                            Description
                            <FieldMic onResult={(t) => form.setValue("description", t)} />
                        </FormLabel>
                        <FormControl>
                            <Input placeholder="Groceries, Uber, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Category */}
            <FormField
                control={form.control}
                name="categoryId"
                render={({ field }: { field: { value: string; onChange: (v: string) => void } }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {categories?.length ? categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                )) : <SelectItem value="default" disabled>No categories found</SelectItem>}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Account */}
            <FormField
                control={form.control}
                name="accountId"
                render={({ field }: { field: { value: string; onChange: (v: string) => void } }) => (
                    <FormItem>
                        <FormLabel>Account</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {accounts?.length ? accounts.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                )) : <SelectItem value="default" disabled>No accounts found</SelectItem>}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Date */}
            <FormField
                control={form.control}
                name="date"
                render={({ field }: { field: { value: Date; onChange: (v: Date) => void } }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                    >
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(d) => { if (d) field.onChange(d); }}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Merchant */}
            <FormField
                control={form.control}
                name="merchant"
                render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> }) => (
                    <FormItem>
                        <FormLabel className="flex justify-between items-center">
                            Merchant
                            <FieldMic onResult={(t) => form.setValue("merchant", t)} />
                        </FormLabel>
                        <FormControl>
                            <Input placeholder="Store or service name" {...field} />
                        </FormControl>
                    </FormItem>
                )}
            />

            {/* Notes */}
            <FormField
                control={form.control}
                name="notes"
                render={({ field }: { field: React.TextareaHTMLAttributes<HTMLTextAreaElement> }) => (
                    <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Additional details..." className="resize-none" {...field} />
                        </FormControl>
                    </FormItem>
                )}
            />

            {/* Tags */}
            <FormField
                control={form.control}
                name="tags"
                render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> }) => (
                    <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                            <Input placeholder="work, travel, food" {...field} />
                        </FormControl>
                    </FormItem>
                )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => form.reset()}>Reset</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#F54142] hover:bg-[#d63636]">
                    {isSubmitting ? "Saving..." : "Save"}
                </Button>
            </div>
        </div>
    );
}

/* ── Per-field microphone button ── */
function FieldMic({ onResult }: { onResult: (text: string) => void }) {
    const [isListening, setIsListening] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isListening) {
             recognitionRef.current?.stop();
             setIsListening(false);
             return;
        }

        // Init
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Voice input not supported.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            if (text) onResult(text);
        };

        recognition.start();
        recognitionRef.current = recognition;
    };

    return (
        <button
            type="button"
            className={cn("field-mic-btn", isListening && "active listening-pulse")}
            onClick={handleToggle}
            title={isListening ? "Stop" : "Voice input"}
        >
            <Mic className="h-3.5 w-3.5" />
        </button>
    );
}
