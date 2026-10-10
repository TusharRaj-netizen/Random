"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, Sparkles, User, Volume2, Square, Mic, AlertCircle } from "lucide-react";
import { useLanguage, apiLanguage } from "@/lib/language";
import { sendChat, type ChatMessage } from "@/lib/api";
import { useSpeech, useSpeechRecognition } from "@/lib/speech";
import Disclaimer from "@/components/Disclaimer";

interface DisplayMessage extends ChatMessage {
  id: string;
  speaking?: boolean;
}

export default function HealthChatbot() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak, stop, speaking, supported: ttsSupported } = useSpeech();
  const speechLang = lang === "hi" ? "hi-IN" : "en-IN";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const suggestions = lang === "hi"
    ? ["मेटफॉर्मिन का जेनेरिक विकल्प क्या है?", "बीपी के लिए कौन सी दवा सस्ती है?", "क्या मैं हाई बीपी में व्यायाम कर सकता हूँ?"]
    : ["What is the generic substitute for Telma 40?", "Which medicine is cheaper for diabetes?", "Can I exercise with high blood pressure?"];

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
      .then((res) => setMessages((prev) => [...prev, { id: `m-${Date.now()}`, role: "model", content: res.reply }]))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Voice input — route transcribed text into chat and auto-submit
  const onVoiceResult = (text: string) => { setInput(text); handleSend(text); };
  const { start: startMic, stop: stopMic, listening, supported: sttSupported, error: sttError, clearError: clearSttError } = useSpeechRecognition(onVoiceResult, speechLang);

  const toggleMic = () => {
    if (listening) { stopMic(); } else { clearSttError(); startMic(); }
  };

  const toggleSpeak = (text: string, id: string) => {
    if (speaking) { stop(); setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, speaking: false } : m))); return; }
    speak(text, speechLang);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, speaking: true } : m)));
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-xl transition-all hover:scale-105 active:scale-95 animate-fade-in" aria-label="Cline AI - Health Companion">
        <Bot className="h-7 w-7" aria-hidden />
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-sage-500 text-[10px] font-bold text-white">AI</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-4 text-white">
              <div className="flex items-center gap-2"><Bot className="h-7 w-7" aria-hidden /><div><h2 className="text-lg font-bold">Cline AI</h2><p className="text-xs text-orange-100">{t("Health Companion", "स्वास्थ्य साथी")}</p></div></div>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/20" aria-label={t("Close", "बंद करें")}><X className="h-6 w-6" aria-hidden /></button>
            </div>

            <div ref={scrollRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="space-y-3 py-4 text-center">
                  <p className="text-base text-gray-600">{t("Namaste! I'm Cline AI. Ask me about medicines, Jan Aushadhi substitutes, prices, or exercises.", "नमस्ते! मैं Cline AI हूँ। दवाएँ, जन औषधि विकल्प, दाम या व्यायाम के बारे में पूछें।")}</p>
                  <div className="grid gap-2">
                    {suggestions.map((s) => (<button key={s} type="button" onClick={() => handleSend(s)} className="rounded-2xl border border-brand-200 bg-white px-3 py-2 text-left text-sm font-medium text-brand-700 hover:bg-brand-50"><Sparkles className="mr-1 inline h-4 w-4 text-brand-400" aria-hidden />{s}</button>))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${m.role === "user" ? "bg-sky-500" : "bg-brand-600"}`}>{m.role === "user" ? <User className="h-4 w-4" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}</span>
                  <div className="max-w-[80%]">
                    <div className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-sky-100 text-gray-800" : "bg-brand-50 text-gray-800 border border-brand-100"}`}>{m.content}</div>
                    {m.role === "model" && ttsSupported && (<button onClick={() => toggleSpeak(m.content, m.id)} className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">{m.speaking ? (<><Square className="h-3 w-3" aria-hidden /> {t("Stop", "रोकें")}</>) : (<><Volume2 className="h-3 w-3" aria-hidden /> {t("Listen", "सुनें")}</>)}</button>)}
                  </div>
                </div>
              ))}
              {loading && (<div className="flex items-center gap-2 text-gray-500"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white"><Sparkles className="h-4 w-4 animate-pulse" aria-hidden /></span><span className="flex gap-1"><span className="h-2 w-2 animate-bounce rounded-full bg-brand-400" /><span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:0.15s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:0.3s]" /></span></div>)}
              {error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{t("Error", "त्रुटि")}: {error}</p>}
            </div>

            {sttError && (
              <div className="flex items-center gap-2 border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                {sttError === "permission-denied" && (lang === "hi" ? "माइक अनुमति अस्वीकृत। ब्राउज़र सेटिंग्स में माइक अनुमति दें।" : "Microphone permission denied. Please allow mic access in browser settings.")}
                {sttError === "not-supported" && (lang === "hi" ? "आवाज़ पहचान इस ब्राउज़र में समर्थित नहीं।" : "Voice recognition not supported in this browser.")}
                {sttError === "network" && (lang === "hi" ? "नेटवर्क समस्या। इंटरनेट जांचें।" : "Network error. Check your internet.")}
                {sttError === "no-speech" && (lang === "hi" ? "कोई आवाज़ नहीं सुनी गई। पुनः प्रयास करें।" : "No speech detected. Please try again.")}
              </div>
            )}

            <div className="border-t border-orange-100 p-3">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }} placeholder={t("Type or tap mic to speak...", "लिखें या माइक दबाकर बोलें...")} className="input-senior flex-1" disabled={loading} />
                {sttSupported && (
                  <button type="button" onClick={toggleMic} aria-pressed={listening} className={`btn px-4 ${listening ? "bg-red-600 text-white" : "btn-secondary"}`} title={t("Voice input", "आवाज़ से लिखें")}>
                    <span className={`relative flex h-6 w-6 items-center justify-center ${listening ? "scale-110" : ""}`}>
                      <Mic className="h-6 w-6" aria-hidden />
                      {listening && <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-40" />}
                    </span>
                  </button>
                )}
                <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4"><Send className="h-5 w-5" aria-hidden /></button>
              </form>
              {listening && <p className="mt-1 animate-pulse text-sm font-bold text-red-600">🎤 {t("Listening... speak now", "सुन रहा हूँ... बोलिए")}</p>}
              <div className="mt-1"><Disclaimer /></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}