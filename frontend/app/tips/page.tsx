"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb, Search, Pill, Clock, AlertTriangle, Users, ThumbsUp, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { getHealthTips, searchMarketMeds, getMedicineInsight, type HealthTip, type MarketMedicine, type MedicineInsight } from "@/lib/api";
import TipIcon from "@/components/TipIcon";
import Disclaimer from "@/components/Disclaimer";

export default function TipsPage() {
  const { t, lang } = useLanguage();
  const [tips, setTips] = useState<HealthTip[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MarketMedicine[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [insight, setInsight] = useState<MedicineInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [selectedMed, setSelectedMed] = useState<MarketMedicine | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getHealthTips().then((d) => setTips(d.tips)).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => { searchMarketMeds(query, 5).then((d) => setSuggestions(d.medicines)).catch(() => {}); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const selectMedicine = (med: MarketMedicine) => {
    setSelectedMed(med);
    setQuery(med.brand_name);
    setShowSug(false);
    setInsightLoading(true);
    getMedicineInsight(med.id).then((d) => setInsight(d)).catch(() => setInsight(null)).finally(() => setInsightLoading(false));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-7 w-7 text-purple-600" aria-hidden />
        <h1 className="section-title">{t("Tips & Insights", "सुझाव व जानकारी")}</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" aria-hidden />
        <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setShowSug(true); }} onFocus={() => setShowSug(true)} onBlur={() => setTimeout(() => setShowSug(false), 200)} placeholder={t("Search medicine for specific tips...", "दवा विशिष्ट सुझाव के लिए खोजें...")} className="input-senior pl-12" />
        {showSug && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-lg">
            {suggestions.map((m) => (<button key={m.id} onClick={() => selectMedicine(m)} className="flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-brand-50"><Pill className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" aria-hidden /><div><p className="text-base font-bold text-gray-800">{m.brand_name}</p><p className="text-xs text-gray-500">{m.salt_composition}</p></div></button>))}
          </div>
        )}
      </div>

      {selectedMed && (
        <div className="space-y-4">
          {insightLoading ? (<p className="text-center text-gray-500">{t("Loading medicine insights...", "दवा जानकारी लोड हो रही है...")}</p>) : insight ? (
            <>
              <div className="card p-4"><h2 className="text-xl font-bold text-gray-800">{selectedMed.brand_name}</h2><span className="chip mt-1 bg-purple-50 text-purple-700">{lang === "hi" ? insight.condition_hi : insight.condition}</span></div>
              <section className="card p-4">
                <h3 className="mb-3 text-lg font-bold text-gray-700">{t("Lifestyle Tips", "जीवनशैली सुझाव")}</h3>
                <div className="space-y-2">
                  {insight.lifestyle_tips.map((tip, i) => (
                    <div key={i} className={`flex items-start gap-2 rounded-2xl p-3 ${tip.type === "do" ? "bg-sage-50" : "bg-red-50"}`}>
                      {tip.type === "do" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sage-600" aria-hidden /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />}
                      <p className={`text-base ${tip.type === "do" ? "text-sage-800" : "text-red-800"}`}>{tip.text}</p>
                    </div>
                  ))}
                </div>
              </section>
              <div className="card flex items-start gap-3 p-4"><Clock className="mt-0.5 h-6 w-6 shrink-0 text-brand-500" aria-hidden /><div><h3 className="text-base font-bold text-gray-700">{t("Best Timing", "सर्वोत्तम समय")}</h3><p className="text-base text-gray-600">{insight.timing_advice}</p></div></div>
              <div className="card flex items-start gap-3 p-4"><AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" aria-hidden /><div><h3 className="text-base font-bold text-gray-700">{t("Food Interactions", "खाद्य अंतःक्रिया")}</h3><p className="text-base text-gray-600">{insight.food_interactions}</p></div></div>
              <section className="card p-4">
                <h3 className="mb-3 flex items-center gap-1 text-lg font-bold text-gray-700"><Users className="h-5 w-5 text-purple-500" aria-hidden />{t("Patient Experiences & Efficacy", "रोगी अनुभव व प्रभावकारिता")}</h3>
                <div className="space-y-3">
                  {insight.patient_experiences.map((exp, i) => (
                    <div key={i} className="rounded-2xl border border-purple-100 bg-purple-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-gray-800">{exp.patient}</span>
                        <span className={`chip ${exp.effectiveness === "High" ? "bg-sage-100 text-sage-700" : "bg-amber-100 text-amber-700"}`}><ThumbsUp className="h-4 w-4" aria-hidden />{exp.effectiveness}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{exp.feedback}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (<div className="card p-4 text-center"><p className="text-base text-gray-500">{t("No specific insights for this medicine. See general tips below.", "इस दवा के लिए विशिष्ट जानकारी नहीं। नीचे सामान्य सुझाव देखें।")}</p></div>)}
        </div>
      )}

      {!selectedMed && (
        <div className="space-y-3">
          <p className="text-lg text-gray-600">{t("Simple daily habits for healthy aging.", "सेहतमंद बुढ़ापे के लिए आसान रोज़मर्रा की आदतें।")}</p>
          {tips.map((tip) => (
            <div key={tip.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600"><TipIcon name={tip.icon} className="h-6 w-6" /></span>
                <div>
                  <div className="flex items-center gap-2"><h2 className="text-lg font-bold text-gray-800">{lang === "hi" ? tip.title_hindi : tip.title}</h2><span className="chip bg-purple-50 text-purple-700">{tip.category}</span></div>
                  <p className="mt-1 text-base text-gray-600">{lang === "hi" ? tip.body_hindi : tip.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Disclaimer />
    </div>
  );
}