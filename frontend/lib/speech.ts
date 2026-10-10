"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Text-to-Speech (Web Speech API) with a senior-friendly slow rate
// ---------------------------------------------------------------------------
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback((text: string, lang: string = "en-IN") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF]/gu, "").replace(/[•]/g, ", ");
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = lang;
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported };
}

// ---------------------------------------------------------------------------
// Speech-to-Text (SpeechRecognition / webkitSpeechRecognition) for voice input
// ---------------------------------------------------------------------------
export type STTErrorType = "not-supported" | "permission-denied" | "network" | "no-speech" | "aborted" | null;

export function useSpeechRecognition(onResult: (text: string) => void, lang: string = "en-IN") {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<STTErrorType>(null);
  const recognitionRef = useRef<any>(null);
  const callbackRef = useRef(onResult);
  callbackRef.current = onResult;
  const manualStopRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      setError("not-supported");
      return;
    }
    setSupported(true);
    setError(null);

    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ")
        .trim();
      if (transcript) {
        callbackRef.current(transcript);
      }
    };

    rec.onerror = (event: any) => {
      const errType = event.error || "unknown";
      if (errType === "not-allowed" || errType === "service-not-allowed") {
        setError("permission-denied");
      } else if (errType === "network") {
        setError("network");
      } else if (errType === "no-speech") {
        setError("no-speech");
      } else if (errType === "aborted") {
        // User manually stopped — not a real error
      }
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      // Auto-restart if we were listening and didn't manually stop
      if (!manualStopRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setListening(true);
        } catch {
          // Already started or can't restart
        }
      }
    };

    recognitionRef.current = rec;

    return () => {
      manualStopRef.current = true;
      try { rec.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      setError("not-supported");
      return;
    }
    manualStopRef.current = false;
    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch (e: any) {
      // If already started, try stopping first then starting
      try { rec.stop(); } catch { /* ignore */ }
      try { rec.start(); setListening(true); } catch { setListening(false); }
    }
  }, []);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { start, stop, listening, supported, error, clearError };
}