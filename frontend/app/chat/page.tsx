"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Mic, Volume2, Square, Sparkles, User } from "lucide-react";
import { useLanguage, apiLanguage } from "@/lib/language";
import { sendChat, type ChatMessage } from "@/lib/api";
import { useSpeech, useSpeechRecognition } from "@/lib/speech";
import Disclaimer from "@/components/Disclaimer";

interface DisplayMessage extends ChatMessage {
  id: string;
  speaking?: boolean;
}

export default function ChatPage() {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak, stop, speaking, supported: ttsSupported } = useSpeech();

  const handleResult = (text: string) => {
    setInput(text);
    if (text.trim()) handleSend(text);
  };

  const { start, stop: stopMic, listening, supported: sttSupported } = useSpeechRecognition(
    handleResult,
    lang === "hi" ? "hi-IN" : "en-IN",
  );

  const speechLang = lang === "hi" ? "hi-IN" : "en-IN";

  const suggestions =
    lang === "hi"
      ? [
          "मेटफॉर्मिन के बारे में बताओ",
          "जन औषधि स्टोर कहाँ मिलेगा?",
          "बीपी के लिए कौन सी दवा है?",
          "सेहतमंद आहार सुझाएँ",
        ]
      : [
          "Tell me about Metformin",
          "Where can I find a Jan-Aushadhi store?",
          "Which medicine is for blood pressure?",
          "Suggest a healthy diet for seniors",
        ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;
    setError(null);
    const userMsg: DisplayMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const history: ChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    sendChat(text, history, apiLanguage(lang))
      .then((res) => {
        const botMsg: DisplayMessage = { id: `m-${Date.now()}`, role: "model", content: res.reply };
        setMessages((prev) => [...prev, botMsg]);
      })
      .catch((e: Error) => setError(e.message || "Something went wrong"))
      .finally(() => setLoading(false));
  };

  const toggleSpeak = (text: string, id: string) => {
    if (speaking) {
      stop();
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, speaking: false } : m)));
      return;
    }
    speak(text, speechLang);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, speaking: true } : m)));
  };

  return (
    <div className="flex h-[calc(100vh-9.5rem)] flex-col animate-fade-in">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-brand-500" aria-hidden />
        <h1 className="section-title">{t("Ask Vridh-Mitra", "वृद्ध-मित्र से पूछें")}</h1>
      </div>

      <div
        ref={scrollRef}
        className="chat-scroll flex-1 space-y-3 overflow-y-auto rounded-3xl border border-orange-100 bg-white p-4"
      >
        {messages.length === 0 && (
          <div className="space-y-4 py-4 text-center">
            <p className="text-lg text-gray-600">
              {t(
                "Namaste! I am your health companion. Ask me about medicines, prices or general health.",
                "नमस्ते! मैं आपका स्वास्थ्य साथी हूँ। दवाओं, दाम या स्वास्थ्य के बारे में पूछें।",
              )}
            </p>
            <div className="grid gap-2">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => handleSend(s)} className="btn-secondary w-full justify-start text-left">
                  <Sparkles className="h-5 w-5 shrink-0 text-brand-500" aria-hidden />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${m.role === "user" ? "bg-sky-500" : "bg-brand-600"}`}>
              {m.role === "user" ? <User className="h-5 w-5" aria-hidden /> : <Sparkles className="h-5 w-5" aria-hidden />}
            </span>
            <div className="max-w-[80%]">
              <div className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-lg ${m.role === "user" ? "bg-sky-100 text-gray-800" : "bg-brand-50 text-gray-800 border border-brand-100"}`}>
                {m.content}
              </div>
              {m.role === "model" && ttsSupported && (
                <button type="button" onClick={() => toggleSpeak(m.content, m.id)} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                  {m.speaking ? (<><Square className="h-4 w-4" aria-hidden /> {t("Stop", "रोकें")}</>) : (<><Volume2 className="h-4 w-4" aria-hidden /> {t("Listen", "सुनें")}</>)}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
              <Sparkles className="h-5 w-5 animate-pulse" aria-hidden />
            </span>
            <span className="flex gap-1">
              <span className="h-3 w-3 animate-bounce rounded-full bg-brand-400" />
              <span className="h-3 w-3 animate-bounce rounded-full bg-brand-400 [animation-delay:0.15s]" />
              <span className="h-3 w-3 animate-bounce rounded-full bg-brand-400 [animation-delay:0.3s]" />
            </span>
          </div>
        )}

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700" role="alert">
            {t("Error", "त्रुटि")}: {error}
          </p>
        )}
      </div>

      <div className="mt-3">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="chat-input" className="sr-only">{t("Type your message", "अपना संदेश लिखें")}</label>
            <textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={t("Type or speak your question...", "लिखें या बोलकर पूछें...")}
              rows={1}
              className="input-senior max-h-32 resize-none"
              disabled={loading}
            />
          </div>
          {sttSupported && (
            <button type="button" onClick={() => (listening ? stopMic() : start())} aria-pressed={listening} className={`btn ${listening ? "bg-red-600 text-white" : "btn-secondary"}`} title={t("Voice input", "आवाज़ से लिखें")}>
              <span className="relative flex h-6 w-6 items-center justify-center">
                <Mic className="h-6 w-6" aria-hidden />
                {listening && <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-40" />}
              </span>
            </button>
          )}
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary">
            <Send className="h-6 w-6" aria-hidden />
            <span className="hidden sm:inline">{t("Send", "भेजें")}</span>
          </button>
        </form>
        {listening && (
          <p className="mt-1 animate-pulse text-sm font-semibold text-red-600">
            {t("Listening... speak now", "सुन रहा हूँ... बोलिए")}
          </p>
        )}
        <div className="mt-2"><Disclaimer /></div>
      </div>
    </div>
  );
}