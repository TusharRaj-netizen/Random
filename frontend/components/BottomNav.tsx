"use client";

import {
  MessageCircle, Pill, Bell, Lightbulb, Home, MapPin, HeartPulse, BarChart3, Landmark,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/language";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const items = [
    { href: "/", label: t("Home", "होम"), icon: Home, match: pathname === "/" },
    { href: "/chat", label: t("Ask", "पूछें"), icon: MessageCircle, match: pathname.startsWith("/chat") },
    { href: "/facilities", label: t("Nearby", "आस-पास"), icon: MapPin, match: pathname.startsWith("/facilities") },
    { href: "/medicines", label: t("Medicines", "दवाएँ"), icon: Pill, match: pathname.startsWith("/medicines") },
    { href: "/prices", label: t("Prices", "दाम"), icon: BarChart3, match: pathname.startsWith("/prices") },
    { href: "/reminders", label: t("Reminders", "रिमाइंडर"), icon: Bell, match: pathname.startsWith("/reminders") },
    { href: "/sos", label: t("SOS", "एसओएस"), icon: HeartPulse, match: pathname.startsWith("/sos") },
    { href: "/schemes", label: t("Schemes", "योजना"), icon: Landmark, match: pathname.startsWith("/schemes") },
    { href: "/tips", label: t("Tips", "सुझाव"), icon: Lightbulb, match: pathname.startsWith("/tips") },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-orange-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex max-w-3xl items-stretch justify-start gap-0.5 overflow-x-auto px-1 pb-[env(safe-area-inset-bottom)] chat-scroll">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.match ? "page" : undefined}
              className={`flex min-w-[4rem] flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold transition-colors ${
                item.match ? "text-brand-600" : "text-gray-500 hover:text-brand-500"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
                  item.match ? "bg-brand-100" : "bg-transparent"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-[0.7rem]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}