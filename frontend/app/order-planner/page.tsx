"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingCart, Plus, Trash2, Calendar, Package, IndianRupee, TrendingDown, Search, MessageCircle, Bell } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { searchMarketMeds, calculateBasket, type MarketMedicine, type BasketCalculationResponse } from "@/lib/api";

interface OrderItem { med: MarketMedicine; dosage: number; }

const DURATIONS = [
  { days: 7, en: "Weekly (7 days)", hi: "साप्ताहिक (7 दिन)" },
  { days: 30, en: "Monthly (30 days)", hi: "मासिक (30 दिन)" },
  { days: 90, en: "3 Months (90 days)", hi: "3 माह (90 दिन)" },
  { days: 365, en: "Yearly (365 days)", hi: "वार्षिक (365 दिन)" },
];

export default function OrderPlannerPage() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [duration, setDuration] = useState(30);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MarketMedicine[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [result, setResult] = useState<BasketCalculationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => { searchMarketMeds(query, 8).then((d) => setSuggestions(d.medicines)).catch(() => {}); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const addMedicine = (med: MarketMedicine) => { setItems((prev) => [...prev, { med, dosage: 1 }]); setQuery(""); setShowSug(false); };
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateDosage = (idx: number, val: number) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, dosage: Math.max(0.5, val) } : it));
  const calculate = () => { if (items.length === 0) return; setLoading(true); calculateBasket(items.map((it) => ({ medicine_id: it.med.id, daily_dosage: it.dosage })), duration).then((d) => setResult(d)).catch(() => {}).finally(() => setLoading(false)); };

  const exportWhatsApp = () => {
    if (!result) return;
    let msg = "🧾 *Vridh-Mitra Recurring Order* 🧾\n";
    msg += `Duration: ${duration} days\n\n`;
    result.items.forEach((it, i) => { msg += `${i + 1}. ${it.brand_name} — ${it.daily_dosage}/day × ${duration}d = ${it.total_units} units (${it.strips_needed} strips)\n`; msg += `   Jan Aushadhi: ₹${it.jan_aushadhi_total} | Branded: ₹${it.highest_price}\n`; });
    msg += `\n💰 *Total Jan Aushadhi: ₹${result.source_totals["Jan Aushadhi PMBJP"] || 0}*`;
    msg += `\n💵 *Total Savings: ₹${result.total_savings}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const refillDate = new Date(Date.now() + duration * 86400000);
  const alertDate = new Date(refillDate.getTime() - 3 * 86400000);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-7 w-7 text-brand-500" aria-hidden />
        <h1 className="section-title">{t("Recurring Refill Planner", "आवर्ती रिफिल प्लानर")}</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" aria-hidden />
        <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setShowSug(true); }} onFocus={() => setShowSug(true)} onBlur={() => setTimeout(() => setShowSug(false), 200)} placeholder={t("Search medicine to add...", "दवा खोजकर जोड़ें...")} className="input-senior pl-12" />
        {showSug && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-lg">
            {suggestions.map((m) => (<button key={m.id} onClick={() => addMedicine(m)} className="flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-brand-50"><Plus className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" aria-hidden /><div><p className="text-base font-bold text-gray-800">{m.brand_name}</p><p className="text-xs text-gray-500">{m.salt_composition}</p></div></button>))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block font-semibold text-gray-700"><Calendar className="mr-1 inline h-5 w-5" aria-hidden />{t("Duration", "अवधि")}</label>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (<button key={d.days} onClick={() => setDuration(d.days)} className={`chip text-base px-4 py-2 ${duration === d.days ? "bg-brand-600 text-white" : "bg-white text-brand-700 border border-brand-200"}`}>{lang === "hi" ? d.hi : d.en}</button>))}
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="card flex items-center gap-3 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600"><Package className="h-5 w-5" aria-hidden /></span>
              <div className="flex-1"><p className="text-base font-bold text-gray-800">{it.med.brand_name}</p><p className="text-xs text-gray-500">{it.med.salt_composition} · Pack of {it.med.pack_size}</p></div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateDosage(idx, it.dosage - 0.5)} className="h-9 w-9 rounded-lg bg-gray-100 text-lg font-bold">−</button>
                <input type="number" value={it.dosage} onChange={(e) => updateDosage(idx, parseFloat(e.target.value) || 1)} className="w-14 rounded-lg border-2 border-gray-200 px-2 py-1 text-center text-base" />
                <button onClick={() => updateDosage(idx, it.dosage + 0.5)} className="h-9 w-9 rounded-lg bg-gray-100 text-lg font-bold">+</button>
              </div>
              <span className="text-sm text-gray-500">/day</span>
              <button onClick={() => removeItem(idx)} className="btn-ghost text-red-600"><Trash2 className="h-5 w-5" aria-hidden /></button>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && <p className="rounded-3xl bg-white p-6 text-center text-lg text-gray-500">{t("Add medicines to build your recurring order kit.", "अपना आवर्ती ऑर्डर बनाने के लिए दवाएँ जोड़ें।")}</p>}
      <button onClick={calculate} disabled={items.length === 0 || loading} className="btn-primary w-full">{t("Calculate Basket Cost", "बास्केट लागत गणना करें")}</button>

      {result && (
        <>
          <div className="card p-4">
            <h3 className="mb-3 text-lg font-bold text-gray-700">{t("Basket Cost Summary", "बास्केट लागत सारांश")}</h3>
            <div className="space-y-2">
              {Object.entries(result.source_totals).map(([src, total]) => (
                <div key={src} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-base font-semibold text-gray-700">{src}</span>
                  <span className={`text-lg font-bold ${src === "Jan Aushadhi PMBJP" ? "text-sage-600" : "text-gray-800"}`}><IndianRupee className="inline h-4 w-4" aria-hidden />{total}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-sage-50 p-3">
              <span className="flex items-center gap-1 text-lg font-bold text-sage-700"><TrendingDown className="h-5 w-5" aria-hidden />{t("Total Savings", "कुल बचत")}</span>
              <span className="text-xl font-extrabold text-sage-600">₹{result.total_savings}</span>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="mb-2 text-lg font-bold text-gray-700">{t("Per-Medicine Breakdown", "प्रति-दवा विवरण")}</h3>
            {result.items.map((it, i) => (
              <div key={i} className="border-b border-gray-100 py-2 last:border-0">
                <p className="font-bold text-gray-800">{it.brand_name}</p>
                <p className="text-sm text-gray-500">{it.daily_dosage}/day × {it.duration_days}d = {it.total_units} units → {it.strips_needed} strips</p>
                <div className="mt-1 flex flex-wrap gap-2 text-sm">
                  <span className="chip bg-sage-50 text-sage-700">JA: ₹{it.jan_aushadhi_total}</span>
                  <span className="chip bg-gray-50 text-gray-600">Branded: ₹{it.highest_price}</span>
                  <span className="chip bg-red-50 text-red-600">Save: ₹{it.savings}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="card flex items-center gap-3 border-2 border-amber-200 bg-amber-50 p-4">
            <Bell className="h-6 w-6 text-amber-600" aria-hidden />
            <div>
              <p className="text-base font-bold text-amber-700">{t("Refill Reminder", "रिफिल रिमाइंडर")}</p>
              <p className="text-sm text-amber-600">{t("Supply ends", "सप्लाई समाप्त")}: {refillDate.toLocaleDateString()} · {t("Alert by", "अलर्ट तिथि")}: {alertDate.toLocaleDateString()}</p>
            </div>
          </div>
          <button onClick={exportWhatsApp} className="btn-primary w-full"><MessageCircle className="h-6 w-6 text-sage-300" aria-hidden />{t("Export / Reorder via WhatsApp", "व्हाट्सएप से निर्यात / पुनः ऑर्डर")}</button>
        </>
      )}
    </div>
  );
}