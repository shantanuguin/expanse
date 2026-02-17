import { useState, useEffect, useRef } from "react";

interface SpeechRecognitionEvent {
    resultIndex: number;
    results: {
        length: number;
        [index: number]: {
            isFinal: boolean;
            [index: number]: {
                transcript: string;
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
}

export interface SpeechRecognitionHook {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    error: string | null;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as unknown as { SpeechRecognition: new () => SpeechRecognition }).SpeechRecognition ||
                (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = "en-US";

                const recognition = recognitionRef.current;
                if (recognition) {
                    recognition.onstart = () => setIsListening(true);
                    recognition.onend = () => setIsListening(false);
                    recognition.onerror = (event: SpeechRecognitionErrorEvent) => setError(event.error);
                    recognition.onresult = (event: SpeechRecognitionEvent) => {
                        let finalTranscript = "";
                        for (let i = event.resultIndex; i < event.results.length; i++) {
                            const transcriptSegment = event.results[i][0].transcript;
                            if (event.results[i].isFinal) {
                                finalTranscript += transcriptSegment;
                            }
                        }
                        if (finalTranscript) {
                            setTranscript((prev) => prev + finalTranscript);
                        }
                    };
                }
            } else {
                // Use a ref or just don't set error synchronously to avoid strict mode issues if possible, 
                // or just acknowledge it's a browser check. 
                // Better: setError in a timeout or just once.
                setTimeout(() => setError("Browser does not support Speech Recognition."), 0);
            }
        }
    }, []);


    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Start listening error", e);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error("Stop listening error", e);
            }
        }
    };

    const resetTranscript = () => setTranscript("");

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        error
    };
}
