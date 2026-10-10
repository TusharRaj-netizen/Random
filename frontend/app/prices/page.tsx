"use client";

import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { TrendingDown, IndianRupee, BarChart3, Star, Search, Loader2, Pill } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { searchMarketMeds, getFluctuations, type MarketMedicine, type FluctuationResponse } from "@/lib/api";

const SOURCE_COLORS: Record<string, string> = {
  "Tata 1mg": "#0ea5e9", "Apollo Pharmacy": "#6366f1", "MedPlus": "#f59e0b",
  "Jan Aushadhi PMBJP": "#16a34a", "NPPA Government Ceiling Price": "#ef4444",
};

export default function MedicinePriceTracker() {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MarketMedicine[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<MarketMedicine | null>(null);
  const [data, setData] = useState<FluctuationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search for autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setSuggestions([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      searchMarketMeds(query, 10).then((d) => setSuggestions(d.medicines)).catch(() => setSuggestions([])).finally(() => setSearching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Auto-load Metformin 500 on mount
  useEffect(() => {
    searchMarketMeds("Metformin", 1).then((d) => {
      if (d.medicines[0]) selectMedicine(d.medicines[0]);
    }).catch(() => {});
  }, []);

  const selectMedicine = (med: MarketMedicine) => {
    setSelected(med);
    setQuery(med.brand_name);
    setShowSug(false);
    setLoading(true);
    getFluctuations(med.id).then((d) => { setData(d); setError(null); }).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  };

  const chartData = (() => {
    if (!data) return [];
    const months = Array.from(new Set(data.history.map((h) => h.recorded_date))).sort();
    return months.map((month) => {
      const row: Record<string, number | string> = { month };
      for (const pt of data.history) { if (pt.recorded_date === month) row[pt.source] = pt.selling_price; }
      return row;
    });
  })();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-7 w-7 text-brand-500" aria-hidden />
        <h1 className="section-title">{t("Price Tracker", "दाम ट्रैकर")}</h1>
      </div>

      {/* Search bar with autocomplete */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSug(true); }}
          onFocus={() => setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 200)}
          placeholder={t("Search medicine name or salt...", "दवा का नाम या नमक खोजें...")}
          className="input-senior pl-12"
          aria-label={t("Search medicines", "दवाएँ खोजें")}
        />
        {searching && <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-brand-400" aria-hidden />}

        {showSug && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-lg">
            {suggestions.map((m) => (
              <button key={m.id} onClick={() => selectMedicine(m)} className="flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-brand-50">
                <Pill className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" aria-hidden />
                <div>
                  <p className="text-base font-bold text-gray-800">{m.brand_name}</p>
                  <p className="text-xs text-gray-500">{m.salt_composition} · {m.manufacturer}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && data && !loading && (
        <>
          <div className="card p-4">
            <h2 className="text-xl font-bold text-gray-800">{selected.brand_name}</h2>
            <p className="text-base text-gray-500">{selected.salt_composition}</p>
            <p className="text-sm text-gray-400">{selected.manufacturer} · {selected.dosage_form} · Pack of {selected.pack_size}</p>
          </div>

          <section>
            <h3 className="mb-2 text-lg font-bold text-gray-700">{t("Current Prices", "वर्तमान दाम")}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.current_prices.filter((c) => !c.source.includes("NPPA")).map((c) => (
                <div key={c.source} className={`card p-4 ${c.is_jan_aushadhi ? "border-2 border-sage-300" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-base font-bold text-gray-700">{c.is_jan_aushadhi && <Star className="h-4 w-4 text-sage-600" aria-hidden />}{c.source}</span>
                    <span className="text-xl font-extrabold text-gray-800"><IndianRupee className="inline h-5 w-5" aria-hidden />{c.selling_price}</span>
                  </div>
                  <p className="text-sm text-gray-400">MRP: ₹{c.mrp}</p>
                  {c.savings_vs_highest != null && c.savings_vs_highest > 0 && (
                    <span className="chip mt-1 bg-sage-100 text-sage-700"><TrendingDown className="h-4 w-4" aria-hidden /> {t("Save", "बचत")} ₹{c.savings_vs_highest}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl border-2 border-dashed border-red-300 bg-red-50 p-4">
              <p className="text-base font-bold text-red-700">{t("NPPA Government Ceiling", "NPPA सरकारी अधिकतम दाम")}: ₹{data.nppa_ceiling_price}</p>
              <p className="text-sm text-red-600">{t("Jan Aushadhi saves you", "जन औषधि से बचत")} ₹{data.jan_aushadhi_monthly_savings}/{t("month", "माह")}</p>
            </div>
          </section>

          <section className="card p-4">
            <h3 className="mb-3 text-lg font-bold text-gray-700">{t("6-Month Price Trends", "6-माह दाम रुझान")}</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontSize: 14, borderRadius: 12 }} formatter={(v: any) => [`₹${v}`, ""]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {Object.keys(SOURCE_COLORS).map((src) => (
                    <Line key={src} type="monotone" dataKey={src} stroke={SOURCE_COLORS[src]} strokeWidth={src === "NPPA Government Ceiling Price" ? 0 : 2} dot={false} />
                  ))}
                  <ReferenceLine y={data.nppa_ceiling_price} stroke="#ef4444" strokeDasharray="8 4" label={{ value: lang === "hi" ? "NPPA अधिकतम" : "NPPA Ceiling", fontSize: 11, fill: "#ef4444", position: "insideTopRight" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
      {loading && <p className="text-center text-gray-500">{t("Loading price data...", "दाम डेटा लोड हो रहा है...")}</p>}
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700" role="alert">{error}</p>}
    </div>
  );
}