import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ── Browser Speech API type shims ── */
interface SpeechRecognitionEvent {
    resultIndex: number;
    results: {
        length: number;
        [index: number]: {
            isFinal: boolean;
            [index: number]: {
                transcript: string;
                confidence: number;
            };
        };
    };
}

interface SpeechRecognitionErrorEvent {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

export interface SpeechRecognitionHook {
    isListening: boolean;
    /** Final confirmed transcript (accumulated). */
    transcript: string;
    /** Live interim text that updates in real-time as user speaks. */
    interimTranscript: string;
    /** Average confidence of the final results (0 – 1). */
    confidence: number;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    error: string | null;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [confidence, setConfidence] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const isSupported = useMemo(() => {
        if (typeof window === "undefined") return true; // SSR: assume supported
        return !!(
            (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition ||
            (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition
        );
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const SR =
            (window as unknown as { SpeechRecognition: new () => SpeechRecognition }).SpeechRecognition ||
            (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition;

        if (!SR) return;

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript("");      // clear lingering interim on stop
        };
        recognition.onerror = (event) => {
            if (event.error !== "aborted") setError(event.error);
        };

        recognition.onresult = (event) => {
            let finalText = "";
            let interim = "";
            let totalConf = 0;
            let finalCount = 0;

            for (let i = 0; i < event.results.length; i++) {
                const segment = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalText += segment;
                    totalConf += event.results[i][0].confidence;
                    finalCount++;
                } else {
                    interim += segment;
                }
            }

            if (finalText) {
                setTranscript((prev) => prev + finalText);
                setConfidence(finalCount > 0 ? totalConf / finalCount : 0);
            }
            setInterimTranscript(interim);
        };

        recognitionRef.current = recognition;
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current || isListening) return;
        setError(null);
        setTranscript("");
        setInterimTranscript("");
        setConfidence(0);
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error("Start listening error", e);
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current || !isListening) return;
        try {
            recognitionRef.current.stop();
        } catch (e) {
            console.error("Stop listening error", e);
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setInterimTranscript("");
        setConfidence(0);
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        confidence,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
        error,
    };
}
