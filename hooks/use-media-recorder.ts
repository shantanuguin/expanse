"use client";

import { useState, useRef, useCallback } from "react";

export interface MediaRecorderHook {
    isRecording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<Blob | null>;
    error: string | null;
}

export function useMediaRecorder(): MediaRecorderHook {
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "audio/webm", // Chrome/Firefox distinct preference, usually webm is safe
            });

            chunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting recording:", err);
            setError("Could not access microphone. Please check permissions.");
        }
    }, []);

    const stopRecording = useCallback(async (): Promise<Blob | null> => {
        if (!mediaRecorderRef.current) return null;

        return new Promise((resolve) => {
            const recorder = mediaRecorderRef.current!;

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                // Stop all tracks to release mic
                recorder.stream.getTracks().forEach((track) => track.stop());
                setIsRecording(false);
                mediaRecorderRef.current = null;
                resolve(blob);
            };

            recorder.stop();
        });
    }, []);

    return {
        isRecording,
        startRecording,
        stopRecording,
        error,
    };
}
