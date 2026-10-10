"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { getHealthTips, type HealthTip } from "@/lib/api";
import TipIcon from "@/components/TipIcon";
import Disclaimer from "@/components/Disclaimer";

export default function TipsPage() {
  const { t, lang } = useLanguage();
  const [tips, setTips] = useState<HealthTip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHealthTips()
      .then((d) => setTips(d.tips))
      .catch(() => setTips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-7 w-7 text-purple-600" aria-hidden />
        <h1 className="section-title">{t("Health Tips", "स्वास्थ्य सुझाव")}</h1>
      </div>

      <p className="text-lg text-gray-600">
        {t(
          "Simple daily habits for healthy aging.",
          "सेहतमंद बुढ़ापे के लिए आसान रोज़मर्रा की आदतें।",
        )}
      </p>

      {loading && <p className="text-center text-gray-500">{t("Loading...", "लोड हो रहा है...")}</p>}

      <div className="space-y-3">
        {tips.map((tip) => (
          <div key={tip.id} className="card p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <TipIcon name={tip.icon} className="h-6 w-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-800">
                    {lang === "hi" ? tip.title_hindi : tip.title}
                  </h2>
                  <span className="chip bg-purple-50 text-purple-700">{tip.category}</span>
                </div>
                <p className="mt-1 text-base text-gray-600">
                  {lang === "hi" ? tip.body_hindi : tip.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Disclaimer />
    </div>
  );
}