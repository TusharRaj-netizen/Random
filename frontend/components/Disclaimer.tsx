"use client";

import { ShieldAlert } from "lucide-react";
import { useLanguage } from "@/lib/language";

export default function Disclaimer() {
  const { t } = useLanguage();
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
      <p>
        {t(
          "This is for support only and not a substitute for a doctor. Always consult your physician.",
          "यह केवल सहायता है, डॉक्टर की सलाह का विकल्प नहीं। कृपया चिकित्सक से परामर्श लें।",
        )}
      </p>
    </div>
  );
}