import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/language";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import HealthChatbot from "@/components/HealthChatbot";

export const metadata: Metadata = {
  title: "Vridh-Mitra (वृद्ध-मित्र) | Jan-Aushadhi Healthcare Copilot",
  description:
    "A senior-friendly healthcare copilot for Indian senior citizens: AI health assistant, Jan-Aushadhi generic medicine search, medication reminders and daily health tips.",
  applicationName: "Vridh-Mitra",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi">
      <body className="min-h-screen pb-24">
        <LanguageProvider>
          <Header />
          <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
          <BottomNav />
          <HealthChatbot />
        </LanguageProvider>
      </body>
    </html>
  );
}