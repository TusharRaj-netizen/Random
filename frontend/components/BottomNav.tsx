"use client";

import { MessageCircle, Pill, Bell, Lightbulb, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/language";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const items = [
    { href: "/", label: t("Home", "होम"), icon: Home, match: pathname === "/" },
    {
      href: "/chat",
      label: t("Ask", "पूछें"),
      icon: MessageCircle,
      match: pathname.startsWith("/chat"),
    },
    {
      href: "/medicines",
      label: t("Medicines", "दवाएँ"),
      icon: Pill,
      match: pathname.startsWith("/medicines"),
    },
    {
      href: "/reminders",
      label: t("Reminders", "रिमाइंडर"),
      icon: Bell,
      match: pathname.startsWith("/reminders"),
    },
    {
      href: "/tips",
      label: t("Tips", "सुझाव"),
      icon: Lightbulb,
      match: pathname.startsWith("/tips"),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-orange-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex max-w-3xl items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.match ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs font-semibold transition-colors ${
                item.match ? "text-brand-600" : "text-gray-500 hover:text-brand-500"
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                  item.match ? "bg-brand-100" : "bg-transparent"
                }`}
              >
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="text-[0.8rem]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}