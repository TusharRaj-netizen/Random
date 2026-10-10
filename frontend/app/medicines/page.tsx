"use client";

import { useEffect, useState } from "react";
import { Search, Pill, IndianRupee, TrendingDown, ChevronDown, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { searchMedicines, getMedicineCategories, type Medicine } from "@/lib/api";
import Disclaimer from "@/components/Disclaimer";

export default function MedicinesPage() {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getMedicineCategories().then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      searchMedicines(query, category || undefined)
        .then((d) => setMedicines(d.medicines))
        .catch(() => setMedicines([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, category]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Pill className="h-7 w-7 text-sage-600" aria-hidden />
        <h1 className="section-title">{t("Jan-Aushadhi Medicines", "जन औषधि दवाएँ")}</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Search medicine name...", "दवा का नाम खोजें...")}
          className="input-senior pl-12"
          aria-label={t("Search medicines", "दवाएँ खोजें")}
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("")}
          className={`chip text-base ${category === "" ? "bg-brand-600 text-white" : "bg-white text-brand-700 border border-brand-200"}`}
        >
          {t("All", "सभी")}
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`chip text-base ${category === c ? "bg-brand-600 text-white" : "bg-white text-brand-700 border border-brand-200"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && <p className="text-center text-gray-500">{t("Searching...", "खोज रहे हैं...")}</p>}

      {!loading && medicines.length === 0 && (
        <p className="rounded-3xl bg-white p-6 text-center text-lg text-gray-500">
          {t("No medicines found. Try another name.", "कोई दवा नहीं मिली। दूसरा नाम आज़माएँ।")}
        </p>
      )}

      <div className="space-y-3">
        {medicines.map((m) => {
          const savings = m.branded_price_inr - m.jan_aushadhi_price_inr;
          const pct = Math.round((savings / m.branded_price_inr) * 100);
          const isOpen = expanded === m.id;
          return (
            <div key={m.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : m.id)}
                className="flex w-full items-start gap-3 p-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-sage-600">
                  <Pill className="h-6 w-6" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="text-lg font-bold text-gray-800">
                    {m.generic_name} <span className="text-base font-medium text-gray-500">({m.hindi_name})</span>
                  </p>
                  <p className="text-sm text-gray-500">{m.category} · {m.strength}</p>
                  <div className="mt-1 flex items-center gap-2 text-base">
                    <span className="inline-flex items-center font-bold text-sage-600">
                      <IndianRupee className="h-4 w-4" aria-hidden />{m.jan_aushadhi_price_inr}
                    </span>
                    <span className="text-gray-400 line-through">₹{m.branded_price_inr}</span>
                    <span className="chip bg-sage-100 text-sage-700">
                      <TrendingDown className="h-4 w-4" aria-hidden /> {pct}% {t("off", "कम")}
                    </span>
                  </div>
                </div>
                <ChevronDown className={`mt-1 h-6 w-6 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>

              {isOpen && (
                <div className="border-t border-orange-50 px-4 py-3 text-base text-gray-700 animate-fade-in">
                  <p><strong>{t("Use", "उपयोग")}:</strong> {m.indication}</p>
                  <p><strong>{t("Form", "रूप")}:</strong> {m.dosage_form} ({m.strength})</p>
                  <p><strong>{t("Jan-Aushadhi price", "जन औषधि मूल्य")}:</strong> ₹{m.jan_aushadhi_price_inr}</p>
                  <p><strong>{t("Branded price", "ब्रांडेड मूल्य")}:</strong> ₹{m.branded_price_inr} ({t("save", "बचत")} ₹{savings.toFixed(1)})</p>
                  <div className="mt-2 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-amber-800">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                    <p><strong>{t("Precautions", "सावधानियाँ")}:</strong> {m.precautions}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Disclaimer />
    </div>
  );
}