"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/language";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className="inline-flex items-center rounded-full border-2 border-brand-200 bg-white p-1"
      role="group"
      aria-label="Language selection"
    >
      <span className="sr-only">Select language / भाषा चुनें</span>
      <Languages className="ml-2 mr-1 h-5 w-5 text-brand-500" aria-hidden />
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`rounded-full px-3 py-1 text-base font-semibold transition-colors ${
          lang === "en" ? "bg-brand-600 text-white" : "text-brand-700 hover:bg-brand-50"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("hi")}
        aria-pressed={lang === "hi"}
        className={`rounded-full px-3 py-1 text-base font-semibold transition-colors ${
          lang === "hi" ? "bg-brand-600 text-white" : "text-brand-700 hover:bg-brand-50"
        }`}
      >
        हिं
      </button>
    </div>
  );
}