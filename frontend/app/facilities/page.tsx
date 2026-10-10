"use client";

import { useEffect, useState } from "react";
import { MapPin, Phone, Navigation, Hospital, Pill, Star, RefreshCw, Clock } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { getNearbyFacilities, type NearbyFacility, type FacilityType } from "@/lib/api";
import { useUserLocation } from "@/lib/useUserLocation";

type FilterKey = "all" | "jan_aushadhi" | "hospital" | "pharmacy";

const FILTERS: { key: FilterKey; en: string; hi: string; icon: typeof Hospital }[] = [
  { key: "all", en: "All", hi: "सभी", icon: MapPin },
  { key: "jan_aushadhi", en: "Jan Aushadhi", hi: "जन औषधि", icon: Star },
  { key: "hospital", en: "Hospital", hi: "अस्पताल", icon: Hospital },
  { key: "pharmacy", en: "24x7 Chemist", hi: "24x7 केमिस्ट", icon: Pill },
];

const TYPE_ICON: Record<FacilityType, typeof Hospital> = {
  hospital: Hospital,
  pharmacy: Pill,
  jan_aushadhi: Star,
  chemist_24x7: Clock,
};

export default function FacilitiesPage() {
  const { t, lang } = useLanguage();
  const { location, refresh } = useUserLocation();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [facilities, setFacilities] = useState<NearbyFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location.loading) return;
    setLoading(true);
    getNearbyFacilities(location.lat, location.lng, filter)
      .then((d) => { setFacilities(d.facilities); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [location.lat, location.lng, location.loading, filter]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-7 w-7 text-brand-500" aria-hidden />
          <h1 className="section-title">{t("Nearby Facilities", "आस-पास की सुविधाएँ")}</h1>
        </div>
        <button onClick={refresh} className="btn-secondary" aria-label={t("Refresh location", "स्थान ताज़ा करें")}>
          <RefreshCw className={`h-5 w-5 ${location.loading ? "animate-spin" : ""}`} aria-hidden />
        </button>
      </div>

      <div className="card px-4 py-3 text-base text-gray-600">
        <span className="font-semibold text-brand-600">
          {location.source === "gps" ? "📍 " + t("GPS Location", "जीपीएस स्थान") : "📍 " + t("Default Location (Guwahati)", "डिफ़ॉल्ट स्थान (गुवाहाटी)")}
        </span>
        <span className="ml-2 text-gray-400">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
        {location.error && <p className="mt-1 text-sm text-amber-600">{t("Using default location (GPS unavailable)", "डिफ़ॉल्ट स्थान (जीपीएस अनुपलब्ध)")}</p>}
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {FILTERS.map((f) => {
          const Icon = f.icon;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} role="tab" aria-selected={filter === f.key}
              className={`chip text-base px-4 py-2 ${filter === f.key ? "bg-brand-600 text-white" : "bg-white text-brand-700 border border-brand-200"}`}>
              <Icon className="h-5 w-5" aria-hidden />{lang === "hi" ? f.hi : f.en}
            </button>
          );
        })}
      </div>

      {loading && <p className="text-center text-gray-500">{t("Finding nearby facilities...", "आस-पास की सुविधाएँ खोजी जा रही हैं...")}</p>}
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700" role="alert">{error}</p>}
      {!loading && facilities.length === 0 && (
        <p className="rounded-3xl bg-white p-6 text-center text-lg text-gray-500">{t("No facilities found for this filter.", "इस फ़िल्टर के लिए कोई सुविधा नहीं मिली।")}</p>
      )}

      <div className="space-y-3">
        {facilities.map((f) => {
          const Icon = TYPE_ICON[f.type] ?? MapPin;
          return (
            <div key={f.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${f.type === "jan_aushadhi" ? "bg-sage-100 text-sage-600" : f.type === "hospital" ? "bg-red-100 text-red-600" : "bg-sky-100 text-sky-600"}`}>
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-lg font-bold text-gray-800">{f.name}</p>
                    <span className="chip shrink-0 bg-brand-100 text-brand-700">{f.distance_label}</span>
                  </div>
                  <p className="text-sm text-gray-500">{f.address}</p>
                  {f.open_hours && (
                    <p className="mt-0.5 text-sm text-gray-500">
                      <Clock className="mr-1 inline h-4 w-4" aria-hidden />{f.open_hours}
                      {f.is_24x7 && <span className="ml-1 font-semibold text-sage-600">• {t("Open Now", "अभी खुला")}</span>}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {f.phone && (
                      <a href={`tel:${f.phone}`} className="btn-secondary text-base" aria-label={t("Call", "कॉल करें")}>
                        <Phone className="h-5 w-5" aria-hidden />{t("Call", "कॉल")}
                      </a>
                    )}
                    <a href={f.maps_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-base">
                      <Navigation className="h-5 w-5" aria-hidden />{t("Navigate", "नेविगेट")} 📍
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}