"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MessageCircle,
  Pill,
  Bell,
  Lightbulb,
  PhoneCall,
  Info,
  ArrowRight,
  Stethoscope,
  MapPin,
  HeartPulse,
  BarChart3,
  Landmark,
} from "lucide-react";
import { useLanguage } from "@/lib/language";
import { getHealthTips, type HealthTip } from "@/lib/api";
import Disclaimer from "@/components/Disclaimer";
import TipIcon from "@/components/TipIcon";

export default function HomePage() {
  const { t, lang } = useLanguage();
  const [tip, setTip] = useState<HealthTip | null>(null);

  useEffect(() => {
    getHealthTips()
      .then((data) => setTip(data.tips[new Date().getDate() % data.tips.length]))
      .catch(() => setTip(null));
  }, []);

  const actions = [
    {
      href: "/chat",
      icon: MessageCircle,
      title: t("Ask Vridh-Mitra", "वृद्ध-मित्र से पूछें"),
      desc: t("Talk to your health assistant", "अपने स्वास्थ्य सहायी से बात करें"),
      color: "bg-brand-600",
    },
    {
      href: "/facilities",
      icon: MapPin,
      title: t("Nearby Facilities", "आस-पास सुविधाएँ"),
      desc: t("Hospitals & pharmacies on map", "अस्पताल व दवाई की दुकान"),
      color: "bg-red-600",
    },
    {
      href: "/medicines",
      icon: Pill,
      title: t("Find Medicines", "दवाएँ खोजें"),
      desc: t("Jan-Aushadhi prices & savings", "जन औषधि दाम व बचत"),
      color: "bg-sage-600",
    },
    {
      href: "/prices",
      icon: BarChart3,
      title: t("Price Tracker", "दाम ट्रैकर"),
      desc: t("Compare & track medicine prices", "दवा दाम तुलनें व ट्रैक करें"),
      color: "bg-indigo-600",
    },
    {
      href: "/reminders",
      icon: Bell,
      title: t("Medicine Reminders", "दवा रिमाइंडर"),
      desc: t("Never miss a dose", "कोई खुराक न भूलें"),
      color: "bg-sky-600",
    },
    {
      href: "/sos",
      icon: HeartPulse,
      title: t("SOS & Emergency", "एसओएस व आपातकाल"),
      desc: t("108 ambulance & contacts", "108 एम्बुलेंस व संपर्क"),
      color: "bg-red-700",
    },
    {
      href: "/schemes",
      icon: Landmark,
      title: t("Govt Schemes", "सरकारी योजनाएं"),
      desc: t("Senior healthcare schemes", "बुजुर्ग स्वास्थ्य योजनाएँ"),
      color: "bg-purple-600",
    },
    {
      href: "/tips",
      icon: Lightbulb,
      title: t("Health Tips", "स्वास्थ्य सुझाव"),
      desc: t("Daily tips for healthy aging", "सेहतमंद बुढ़ापे के सुझाव"),
      color: "bg-amber-600",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Emergency banner */}
      <a
        href="tel:112"
        className="flex items-center justify-between gap-3 rounded-3xl border-2 border-red-200 bg-red-50 px-5 py-4 active:scale-[0.99]"
        aria-label={t("Call emergency 112", "आपातकालीन 112 पर कॉल करें")}
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white">
            <PhoneCall className="h-6 w-6" aria-hidden />
            <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse-ring" />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-bold text-red-700">
              {t("Emergency: Call 112", "आपातकाल: 112 पर कॉल करें")}
            </p>
            <p className="text-sm text-red-600">
              {t("Tap for urgent help", "तुरंत मदद के लिए दबाएँ")}
            </p>
          </div>
        </div>
        <ArrowRight className="h-6 w-6 text-red-500" aria-hidden />
      </a>

      {/* Welcome */}
      <section className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-500 px-6 py-6 text-white">
          <h2 className="text-2xl font-extrabold">
            {t("Namaste! 🙏 Welcome", "नमस्ते! 🙏 स्वागत है")}
          </h2>
          <p className="mt-1 text-lg text-orange-50">
            {t(
              "Your friendly health companion for affordable medicines & care.",
              "किफ़ायती दवाओं व देखभाल के लिए आपका स्वास्थ्य साथी।",
            )}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-orange-100 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-md active:scale-[0.98]"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${a.color} text-white`}>
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="text-lg font-bold text-gray-800">{a.title}</span>
                <span className="text-sm text-gray-500">{a.desc}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured tip */}
      {tip && (
        <section className="card p-5">
          <div className="mb-2 flex items-center gap-2 text-brand-600">
            <Stethoscope className="h-5 w-5" aria-hidden />
            <h3 className="text-lg font-bold">
              {t("Today's Health Tip", "आज का स्वास्थ्य सुझाव")}
            </h3>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <TipIcon name={tip.icon} className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-bold text-gray-800">
                {lang === "hi" ? tip.title_hindi : tip.title}
              </p>
              <p className="text-base text-gray-600">
                {lang === "hi" ? tip.body_hindi : tip.body}
              </p>
            </div>
          </div>
          <Link
            href="/tips"
            className="mt-3 inline-flex items-center gap-1 text-base font-semibold text-brand-600 hover:underline"
          >
            {t("See all tips", "सभी सुझाव देखें")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      )}

      {/* About link */}
      <Link
        href="/about"
        className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50"
      >
        <Info className="h-5 w-5" aria-hidden />
        {t("About Jan-Aushadhi & Vridh-Mitra", "जन औषधि व वृद्ध-मित्र के बारे में")}
      </Link>

      <Disclaimer />
    </div>
  );
}