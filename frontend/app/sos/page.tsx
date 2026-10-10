"use client";

import { useEffect, useState } from "react";
import { Phone, Plus, Trash2, HeartPulse, User, NotebookPen, MessageCircle, Save, X } from "lucide-react";
import { useLanguage } from "@/lib/language";
import Disclaimer from "@/components/Disclaimer";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

const CONTACTS_KEY = "vridh-mitra-contacts";
const NOTES_KEY = "vridh-mitra-health-notes";

export default function SosPage() {
  const { t, lang } = useLanguage();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem(CONTACTS_KEY);
      if (c) setContacts(JSON.parse(c));
      const n = localStorage.getItem(NOTES_KEY);
      if (n) setNotes(n);
    } catch { /* ignore */ }
  }, []);

  const saveContacts = (list: EmergencyContact[]) => {
    setContacts(list);
    try { localStorage.setItem(CONTACTS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    saveContacts([...contacts, { id: `c-${Date.now()}`, name: form.name.trim(), phone: form.phone.trim() }]);
    setForm({ name: "", phone: "" });
    setShowForm(false);
  };

  const removeContact = (id: string) => saveContacts(contacts.filter((c) => c.id !== id));

  const onNotesChange = (val: string) => { setNotes(val); setNotesSaved(false); };

  const saveNotes = () => {
    try { localStorage.setItem(NOTES_KEY, notes); setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000); } catch { /* ignore */ }
  };

  useEffect(() => {
    const timer = setTimeout(() => { try { localStorage.setItem(NOTES_KEY, notes); } catch { /* ignore */ } }, 800);
    return () => clearTimeout(timer);
  }, [notes]);

  const sendEmergencySMS = (contact: EmergencyContact) => {
    const msg = lang === "hi"
      ? encodeURIComponent("आपातकाल! मुझे मदद चाहिए। कृपया तुरंत संपर्क करें। - वृद्ध-मित्र ऐप")
      : encodeURIComponent("EMERGENCY! I need help. Please contact me immediately. - Vridh-Mitra App");
    window.open(`https://wa.me/${contact.phone.replace(/[^\d]/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <HeartPulse className="h-7 w-7 text-red-600" aria-hidden />
        <h1 className="section-title">{t("SOS & Emergency", "एसओएस व आपातकाल")}</h1>
      </div>

      <a href="tel:108" className="flex items-center justify-between gap-3 rounded-3xl border-2 border-red-300 bg-red-600 px-5 py-5 text-white shadow-lg active:scale-[0.99]" aria-label={t("Call 108 Ambulance", "108 एम्बुलेंस कॉल करें")}>
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-red-600"><Phone className="h-7 w-7" aria-hidden /></span>
          <div className="leading-tight">
            <p className="text-2xl font-extrabold">{t("108 Ambulance", "108 एम्बुलेंस")}</p>
            <p className="text-base text-red-100">{t("Tap to call now", "अभी कॉल करने हेतु दबाएँ")}</p>
          </div>
        </div>
        <span className="text-3xl font-black">108</span>
      </a>

      <a href="tel:112" className="flex items-center justify-between gap-3 rounded-3xl border-2 border-amber-300 bg-amber-50 px-5 py-4 active:scale-[0.99]" aria-label={t("Call 112 Emergency", "112 आपातकाल कॉल")}>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white"><Phone className="h-6 w-6" aria-hidden /></span>
          <p className="text-xl font-bold text-amber-700">{t("Emergency 112", "आपातकाल 112")}</p>
        </div>
        <span className="text-2xl font-black text-amber-600">112</span>
      </a>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-gray-800">{t("Emergency Contacts", "आपातकालीन संपर्क")}</h2>
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary"><Plus className="h-6 w-6" aria-hidden />{t("Add", "जोड़ें")}</button>
        </div>

        {showForm && (
          <form onSubmit={addContact} className="mb-3 space-y-3 rounded-2xl bg-brand-50 p-4 animate-fade-in">
            <input className="input-senior" placeholder={t("Contact name (e.g. Son)", "संपर्क नाम (जैसे बेटा)")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="input-senior" type="tel" placeholder="+91 9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">{t("Save Contact", "संपर्क सहेजें")}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost"><X className="h-5 w-5" aria-hidden /></button>
            </div>
          </form>
        )}

        {contacts.length === 0 && <p className="text-base text-gray-500">{t("No contacts saved yet. Add family members for quick calling.", "अभी कोई संपर्क नहीं। परिवार के सदस्य जोड़ें।")}</p>}

        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600"><User className="h-6 w-6" aria-hidden /></span>
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-800">{c.name}</p>
                <p className="text-base text-gray-500">{c.phone}</p>
              </div>
              <a href={`tel:${c.phone}`} className="btn-secondary text-base" aria-label={t("Call", "कॉल")}><Phone className="h-5 w-5" aria-hidden />{t("Call", "कॉल")}</a>
              <button onClick={() => sendEmergencySMS(c)} className="btn-secondary text-base" aria-label={t("WhatsApp", "व्हाट्सएप")} title={t("Send emergency WhatsApp", "आपातकालीन व्हाट्सएप भेजें")}><MessageCircle className="h-5 w-5 text-sage-600" aria-hidden /></button>
              <button onClick={() => removeContact(c.id)} className="btn-ghost text-red-600" aria-label={t("Delete", "हटाएँ")}><Trash2 className="h-5 w-5" aria-hidden /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <NotebookPen className="h-6 w-6 text-purple-600" aria-hidden />
          <h2 className="text-xl font-bold text-gray-800">{t("Health Notes", "स्वास्थ्य नोट्स")}</h2>
        </div>
        <p className="mb-2 text-base text-gray-500">{t("Record allergies, doctor instructions, blood sugar/BP logs.", "एलर्जी, डॉक्टर के निर्देश, ब्लड शुगर/बीपी लॉग लिखें।")}</p>
        <textarea
          className="input-senior min-h-[200px] text-lg leading-relaxed"
          placeholder={lang === "hi" ? "जैसे:\n• दवा एलर्जी: पेनिसिलिन\n• डॉ. शर्मा के निर्देश: रोज़ सुबह दवा\n• बीपी आज सुबह: 140/90" : "E.g.:\n• Medicine allergy: Penicillin\n• Dr. Sharma advice: Take medicine every morning\n• BP today morning: 140/90"}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          aria-label={t("Write your health notes", "अपने स्वास्थ्य नोट्स लिखें")}
        />
        <div className="mt-2 flex items-center gap-2">
          <button onClick={saveNotes} className="btn-secondary text-base"><Save className="h-5 w-5" aria-hidden />{t("Save Now", "अभी सहेजें")}</button>
          {notesSaved && <span className="text-base font-semibold text-sage-600">✓ {t("Saved", "सहेजा गया")}</span>}
        </div>
        <p className="mt-1 text-sm text-gray-400">{t("Notes auto-save as you type.", "टाइपते ही नोट्स अपने आप सहेजे जाते हैं।")}</p>
      </section>

      <Disclaimer />
    </div>
  );
}