"use client";

import { useEffect, useState } from "react";
import { Bell, Plus, Trash2, Clock, Pill, Check, X, Utensils, Volume2, AlarmClock } from "lucide-react";
import { useLanguage } from "@/lib/language";
import {
  listReminders,
  createReminder,
  deleteReminder,
  updateReminder,
  type Reminder,
} from "@/lib/api";
import { useAlarm } from "@/lib/useAlarm";
import Disclaimer from "@/components/Disclaimer";

const FREQS = ["daily", "twice_daily", "thrice_daily", "weekly", "as_needed"];
const FREQ_LABELS_EN: Record<string, string> = {
  daily: "Daily",
  twice_daily: "Twice daily",
  thrice_daily: "Thrice daily",
  weekly: "Weekly",
  as_needed: "As needed",
};
const FREQ_LABELS_HI: Record<string, string> = {
  daily: "रोज़",
  twice_daily: "दिन में दो बार",
  thrice_daily: "दिन में तीन बार",
  weekly: "हफ़्ते में",
  as_needed: "ज़रूरत पड़ने पर",
};

export default function RemindersPage() {
  const { t, lang } = useLanguage();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    medicine_name: "",
    dosage: "",
    time_slots: ["08:00"],
    frequency: "daily",
    with_food: true,
    notes: "",
  });

  const { settings: alarmSettings, saveSettings: saveAlarmSettings, alarm, markTaken, snooze } = useAlarm(reminders);

  const load = () => {
    setLoading(true);
    listReminders().then(setReminders).catch(() => setReminders([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const addSlot = () => setForm((f) => ({ ...f, time_slots: [...f.time_slots, "12:00"] }));
  const removeSlot = (i: number) =>
    setForm((f) => ({ ...f, time_slots: f.time_slots.filter((_, idx) => idx !== i) }));
  const updateSlot = (i: number, val: string) =>
    setForm((f) => ({ ...f, time_slots: f.time_slots.map((s, idx) => (idx === i ? val : s)) }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    createReminder(form)
      .then(() => {
        setForm({ medicine_name: "", dosage: "", time_slots: ["08:00"], frequency: "daily", with_food: true, notes: "" });
        setShowForm(false);
        load();
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setSubmitting(false));
  };

  const remove = (id: string) => {
    if (!confirm(t("Delete this reminder?", "यह रिमाइंडर हटाएँ?"))) return;
    deleteReminder(id).then(load).catch((err: Error) => setError(err.message));
  };

  const toggleActive = (r: Reminder) => {
    updateReminder(r.id, { active: !r.active }).then(load);
  };

  const freqLabel = (f: string) => (lang === "hi" ? FREQ_LABELS_HI[f] : FREQ_LABELS_EN[f]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="h-7 w-7 text-sky-600" aria-hidden />
          <h1 className="section-title">{t("Medicine Reminders", "दवा रिमाइंडर")}</h1>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          <Plus className="h-6 w-6" aria-hidden />
          {t("Add", "जोड़ें")}
        </button>
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700" role="alert">{error}</p>}

      {showForm && (
        <form onSubmit={submit} className="card space-y-4 p-5 animate-fade-in">
          <div>
            <label htmlFor="med-name" className="mb-1 block font-semibold text-gray-700">{t("Medicine name", "दवा का नाम")}</label>
            <input id="med-name" required value={form.medicine_name}
              onChange={(e) => setForm({ ...form, medicine_name: e.target.value })}
              className="input-senior" placeholder={t("e.g. Metformin", "जैसे मेटफॉर्मिन")} />
          </div>
          <div>
            <label htmlFor="med-dose" className="mb-1 block font-semibold text-gray-700">{t("Dosage", "मात्रा")}</label>
            <input id="med-dose" required value={form.dosage}
              onChange={(e) => setForm({ ...form, dosage: e.target.value })}
              className="input-senior" placeholder={t("e.g. 1 tablet", "जैसे 1 गोली")} />
          </div>
          <div>
            <span className="mb-1 block font-semibold text-gray-700">{t("Times", "समय")}</span>
            <div className="space-y-2">
              {form.time_slots.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" aria-hidden />
                  <input type="time" value={s} onChange={(e) => updateSlot(i, e.target.value)}
                    className="input-senior flex-1" aria-label={t("Time", "समय")} />
                  {form.time_slots.length > 1 && (
                    <button type="button" onClick={() => removeSlot(i)} className="btn-ghost text-red-600" aria-label={t("Remove time", "समय हटाएँ")}>
                      <X className="h-5 w-5" aria-hidden />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addSlot} className="btn-secondary mt-2">
              <Plus className="h-5 w-5" aria-hidden /> {t("Add time", "समय जोड़ें")}
            </button>
          </div>
          <div>
            <label htmlFor="med-freq" className="mb-1 block font-semibold text-gray-700">{t("Frequency", "आवृत्ति")}</label>
            <select id="med-freq" value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="input-senior">
              {FREQS.map((f) => <option key={f} value={f}>{freqLabel(f)}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-3 text-lg font-semibold text-gray-700">
            <input type="checkbox" checked={form.with_food}
              onChange={(e) => setForm({ ...form, with_food: e.target.checked })}
              className="h-6 w-6 rounded accent-brand-600" />
            <Utensils className="h-5 w-5 text-brand-500" aria-hidden />
            {t("Take with food", "खाने के साथ लें")}
          </label>
          <div>
            <label htmlFor="med-notes" className="mb-1 block font-semibold text-gray-700">{t("Notes (optional)", "टिप्पणी (वैकल्पिक)")}</label>
            <textarea id="med-notes" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-senior" rows={2} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? t("Saving...", "सहेज रहे हैं...") : t("Save Reminder", "रिमाइंडर सहेजें")}
          </button>
        </form>
      )}

      {loading && <p className="text-center text-gray-500">{t("Loading...", "लोड हो रहा है...")}</p>}
      {!loading && reminders.length === 0 && (
        <p className="rounded-3xl bg-white p-6 text-center text-lg text-gray-500">
          {t("No reminders yet. Tap Add to create one.", "अभी कोई रिमाइंडर नहीं। जोड़ें दबाएँ।")}
        </p>
      )}

      <div className="space-y-3">
        {reminders.map((r) => (
          <div key={r.id} className={`card p-4 ${r.active ? "" : "opacity-60"}`}>
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <Pill className="h-6 w-6" aria-hidden />
              </span>
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-800">{r.medicine_name}</p>
                <p className="text-sm text-gray-500">{r.dosage} · {freqLabel(r.frequency)}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {r.time_slots.map((s, i) => (
                    <span key={i} className="chip bg-sky-50 text-sky-700">
                      <Clock className="h-4 w-4" aria-hidden /> {s}
                    </span>
                  ))}
                  {r.with_food && (
                    <span className="chip bg-brand-50 text-brand-700">
                      <Utensils className="h-4 w-4" aria-hidden /> {t("with food", "खाने के साथ")}
                    </span>
                  )}
                </div>
                {r.notes && <p className="mt-1 text-sm text-gray-500">{r.notes}</p>}
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => toggleActive(r)} className="btn-ghost text-base" aria-pressed={r.active}>
                {r.active ? (<><Check className="h-5 w-5 text-sage-600" aria-hidden /> {t("Active", "चालू")}</>) : (<><X className="h-5 w-5 text-gray-500" aria-hidden /> {t("Paused", "बंद")}</>)}
              </button>
              <button onClick={() => remove(r.id)} className="btn-ghost text-base text-red-600">
                <Trash2 className="h-5 w-5" aria-hidden /> {t("Delete", "हटाएँ")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Disclaimer />

      {/* Alarm Settings */}
      <section className="card p-4">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-gray-700"><AlarmClock className="h-5 w-5 text-brand-500" aria-hidden />{t("Alarm Settings", "अलार्म सेटिंग्स")}</h3>
        <label className="flex items-center justify-between gap-2 py-2">
          <span className="flex items-center gap-2 text-base font-semibold text-gray-700"><Volume2 className="h-5 w-5 text-brand-500" aria-hidden />{t("Enable Alarm Sound", "अलार्म ध्वनि चालू")}</span>
          <input type="checkbox" checked={alarmSettings.enabled} onChange={(e) => saveAlarmSettings({ ...alarmSettings, enabled: e.target.checked })} className="h-7 w-7 rounded accent-brand-600" />
        </label>
        {alarmSettings.enabled && (
          <div className="py-2">
            <label className="block text-sm font-semibold text-gray-600">{t("Volume", "आवाज़")}: {Math.round(alarmSettings.volume * 100)}%</label>
            <input type="range" min={0} max={1} step={0.1} value={alarmSettings.volume} onChange={(e) => saveAlarmSettings({ ...alarmSettings, volume: parseFloat(e.target.value) })} className="w-full accent-brand-600" />
          </div>
        )}
      </section>

      {/* Alarm Modal */}
      {alarm.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl border-2 border-brand-300 bg-white p-6 text-center shadow-2xl animate-fade-in">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <AlarmClock className="h-10 w-10 animate-pulse text-red-600" aria-hidden />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800">{t("Medicine Time!", "दवा का समय!")}</h2>
            <p className="mt-1 text-lg text-gray-600">{alarm.reminderName}</p>
            <p className="text-sm text-gray-400">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            <div className="mt-5 flex flex-col gap-3">
              <button onClick={markTaken} className="btn-primary w-full bg-sage-600 hover:bg-sage-700"><Check className="h-6 w-6" aria-hidden />{t("Mark as Taken", "ले लिया")}</button>
              <button onClick={snooze} className="btn-secondary w-full"><Clock className="h-6 w-6" aria-hidden />{t("Snooze (5 mins)", "स्नूज़ (5 मिनट)")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}