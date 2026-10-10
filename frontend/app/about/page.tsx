"use client";

import { Info, HeartPulse, Phone, Globe, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/language";
import Disclaimer from "@/components/Disclaimer";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Info className="h-7 w-7 text-brand-500" aria-hidden />
        <h1 className="section-title">{t("About", "परिचय")}</h1>
      </div>

      <section className="card p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <HeartPulse className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="text-xl font-bold text-gray-800">वृद्ध-मित्र (Vridh-Mitra)</h2>
        </div>
        <p className="text-lg text-gray-700">
          {t(
            "Vridh-Mitra is a senior-friendly healthcare copilot built for Indian senior citizens. It helps you find affordable Jan-Aushadhi generic medicines, understand what they are for, set medicine reminders, and answer everyday health questions in simple language.",
            "वृद्ध-मित्र भारत के बजुर्गों के लिए एक सरल स्वास्थ्य सहायी है। यह किफ़ायती जन औषधि दवाएँ खोजने, उनका उपयोग समझने, दवा रिमाइंडर सेट करने और आसान भाषा में स्वास्थ्य सवालों के जवाब देने में मदद करता है।",
          )}
        </p>
      </section>

      <section className="card p-5">
        <h2 className="mb-2 text-xl font-bold text-gray-800">
          {t("What is Jan-Aushadhi?", "जन औषधि क्या है?")}
        </h2>
        <p className="text-lg text-gray-700">
          {t(
            "Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) makes quality generic medicines available at affordable prices through Jan-Aushadhi Kendras across India. Generic medicines have the same active ingredients as branded ones but cost 50-90% less.",
            "प्रधानमंत्री भारतीय जन औषधि परियोजना (PMBJP) जन औषधि केंद्रों के ज़रिए अच्छी क्वालिटी की जेनेरिक दवाएँ किफ़ायती दाम पर उपलब्ध कराती है। जेनेरिक दवाओं में ब्रांडेड जैसे ही तत्व होते हैं, पर दाम 50-90% कम होता है।",
          )}
        </p>
        <div className="mt-3 space-y-2">
          <a href="https://janaushadhi.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-base font-semibold text-brand-700 hover:bg-brand-100">
            <Globe className="h-5 w-5" aria-hidden /> janaushadhi.gov.in
          </a>
          <a href="tel:1800180150" className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-base font-semibold text-brand-700 hover:bg-brand-100">
            <Phone className="h-5 w-5" aria-hidden /> {t("Helpline: 1800-180-1500", "हेल्पलाइन: 1800-180-1500")}
          </a>
          <a href="tel:112" className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-base font-semibold text-red-700 hover:bg-red-100">
            <Phone className="h-5 w-5" aria-hidden /> {t("Emergency: 112", "आपातकाल: 112")}
          </a>
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-2 flex items-center gap-2 text-sage-700">
          <ShieldCheck className="h-6 w-6" aria-hidden />
          <h2 className="text-xl font-bold text-gray-800">{t("Your Safety", "आपकी सुरक्षा")}</h2>
        </div>
        <ul className="list-disc space-y-1 pl-6 text-lg text-gray-700">
          <li>{t("Vridh-Mitra is not a doctor and does not replace medical advice.", "वृद्ध-मित्र डॉक्टर नहीं है और चिकित्सा सलाह का विकल्प नहीं है।")}</li>
          <li>{t("Always consult your physician before starting or changing any medicine.", "कोई भी दवा शुरू या बदलने से पहले हमेशा चिकित्सक से परामर्श लें।")}</li>
          <li>{t("In an emergency, call 112 immediately.", "आपातकाल में तुरंत 112 पर कॉल करें।")}</li>
        </ul>
      </section>

      <Disclaimer />
    </div>
  );
}