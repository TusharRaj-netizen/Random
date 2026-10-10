"use client";

import { useEffect, useState } from "react";
import { Landmark, ExternalLink, ShieldPlus, Accessibility, Stethoscope, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { getSchemes, type GovScheme } from "@/lib/api";

const SCHEME_ICONS: Record<string, typeof Landmark> = {
  "shield-plus": ShieldPlus,
  wheelchair: Accessibility,
  landmark: Landmark,
  stethoscope: Stethoscope,
};

export default function SchemesPage() {
  const { t, lang } = useLanguage();
  const [schemes, setSchemes] = useState<GovScheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchemes().then((d) => setSchemes(d.schemes)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Landmark className="h-7 w-7 text-brand-500" aria-hidden />
        <h1 className="section-title">{t("Govt Schemes", "सरकारी योजनाएं")}</h1>
      </div>

      <p className="text-lg text-gray-600">
        {t("Key government healthcare & welfare schemes for senior citizens.", "बुजुर्गों के लिए प्रमुख सरकारी स्वास्थ्य व कल्याण योजनाएँ।")}
      </p>

      {loading && <p className="text-center text-gray-500">{t("Loading schemes...", "योजनाएँ लोड हो रही हैं...")}</p>}

      <div className="space-y-4">
        {schemes.map((s) => {
          const Icon = SCHEME_ICONS[s.icon] ?? Landmark;
          return (
            <div key={s.id} className="card overflow-hidden">
              <div className="flex items-start gap-3 border-b border-orange-50 bg-gradient-to-br from-brand-50 to-white p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">{lang === "hi" ? s.name_hi : s.name_en}</h2>
                  <p className="text-sm text-gray-400">{lang === "hi" ? s.name_en : s.name_hi}</p>
                  <span className="chip mt-1 bg-brand-100 text-brand-700">{s.category}</span>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="mb-1 text-base font-bold text-gray-700">{t("Benefits", "लाभ")}</h3>
                  <p className="text-base text-gray-600">{lang === "hi" ? s.benefit_summary_hi : s.benefit_summary_en}</p>
                </div>
                <div>
                  <h3 className="mb-1 flex items-center gap-1 text-base font-bold text-gray-700">
                    <CheckCircle2 className="h-5 w-5 text-sage-600" aria-hidden />
                    {t("Eligibility", "पात्रता")}
                  </h3>
                  <p className="text-base text-gray-600">{lang === "hi" ? s.eligibility_hi : s.eligibility_en}</p>
                </div>
                <a href={s.official_link} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                  <ExternalLink className="h-5 w-5" aria-hidden />
                  {t("Visit Official Portal", "आधिकारिक पोर्टल पर जाएँ")}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}