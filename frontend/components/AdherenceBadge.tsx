"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Sun, Moon, Coffee } from "lucide-react";
import { useLanguage } from "@/lib/language";

const KEY = "vridh-mitra-adherence";

interface AdherenceData {
  date: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function defaultData(): AdherenceData {
  return { date: todayStr(), morning: false, afternoon: false, night: false };
}

export default function AdherenceBadge() {
  const { t } = useLanguage();
  const [data, setData] = useState<AdherenceData | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AdherenceData;
        if (parsed.date !== todayStr()) {
          setData(defaultData());
        } else {
          setData(parsed);
        }
      } else {
        setData(defaultData());
      }
    } catch {
      setData(defaultData());
    }
  }, []);

  const toggle = (slot: "morning" | "afternoon" | "night") => {
    if (!data) return;
    const updated = { ...data, [slot]: !data[slot] };
    setData(updated);
    try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  };

  if (!data) return null;

  const allDone = data.morning && data.afternoon && data.night;
  const slots = [
    { key: "morning" as const, label: t("Morning", "सुबह"), icon: Sun, done: data.morning },
    { key: "afternoon" as const, label: t("Afternoon", "दोपहर"), icon: Coffee, done: data.afternoon },
    { key: "night" as const, label: t("Night", "रात"), icon: Moon, done: data.night },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-3">
      <div className={`flex items-center gap-3 rounded-2xl border p-3 ${allDone ? "border-sage-300 bg-sage-50" : "border-orange-100 bg-white"}`}>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${allDone ? "bg-sage-500 text-white" : "bg-brand-100 text-brand-600"}`}>
          {allDone ? <CheckCircle2 className="h-6 w-6" aria-hidden /> : <Circle className="h-6 w-6" aria-hidden />}
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-700">
            {allDone ? t("Today's Routine Complete! 🎉", "आज की दिनचर्या पूरी! 🎉") : t("Today's Medicine Routine", "आज की दवा दिनचर्या")}
          </p>
          <div className="mt-1 flex gap-2">
            {slots.map((s) => {
              const Icon = s.icon;
              return (
                <button key={s.key} onClick={() => toggle(s.key)} className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold transition-colors ${s.done ? "bg-sage-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`} aria-pressed={s.done}>
                  <Icon className="h-4 w-4" aria-hidden />
                  {s.label}
                  {s.done && <CheckCircle2 className="h-4 w-4" aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}