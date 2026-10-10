"use client";

import { HeartPulse } from "lucide-react";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "@/lib/language";

export default function Header() {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-30 border-b border-orange-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
            <HeartPulse className="h-7 w-7" aria-hidden />
          </div>
          <div className="leading-tight">
            <h1 className="text-xl font-extrabold text-gray-800">
              वृद्ध-मित्र
            </h1>
            <p className="text-sm font-medium text-brand-600">
              {t("Jan-Aushadhi Copilot", "जन औषधि कोपायलट")}
            </p>
          </div>
        </div>
        <LanguageToggle />
      </div>
    </header>
  );
}