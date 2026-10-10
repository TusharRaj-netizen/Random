"use client";

import { HeartPulse, Eye, Phone } from "lucide-react";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "@/lib/language";

const SENIOR_KEY = "vridh-mitra-senior-mode";

export default function Header() {
  const { t } = useLanguage();

  const toggleSenior = () => {
    const current = document.documentElement.classList.contains("senior-mode");
    if (current) {
      document.documentElement.classList.remove("senior-mode");
      localStorage.setItem(SENIOR_KEY, "false");
    } else {
      document.documentElement.classList.add("senior-mode");
      localStorage.setItem(SENIOR_KEY, "true");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-orange-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
            <HeartPulse className="h-6 w-6" aria-hidden />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-extrabold text-gray-800">Cline AI</h1>
            <p className="text-xs font-medium text-brand-600">{t("Health Companion", "स्वास्थ्य साथी")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleSenior} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-200 bg-white text-brand-600 hover:bg-brand-50" aria-label={t("Senior Mode", "वरिष्ठ मोड")} title={t("Toggle Senior Mode (larger fonts & contrast)", "वरिष्ठ मोड चालू/बंद (बड़े अक्षर व कंट्रास्ट)")}>
            <Eye className="h-5 w-5" aria-hidden />
          </button>
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}