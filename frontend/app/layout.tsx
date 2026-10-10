import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/language";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import HealthChatbot from "@/components/HealthChatbot";
import AdherenceBadge from "@/components/AdherenceBadge";

export const metadata: Metadata = {
  title: "Cline AI | Jan-Aushadhi Healthcare Copilot",
  description:
    "A senior-friendly healthcare copilot for Indian senior citizens: AI health assistant, Jan-Aushadhi generic medicine search, medication reminders and daily health tips.",
  applicationName: "Cline AI",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ea580c",
};

// Restore Senior Mode before hydration to prevent flash
const seniorScript = `
(function(){
  try {
    if (localStorage.getItem('vridh-mitra-senior-mode') === 'true') {
      document.documentElement.classList.add('senior-mode');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi">
      <head>
        <script dangerouslySetInnerHTML={{ __html: seniorScript }} />
      </head>
      <body className="min-h-screen pb-24">
        <LanguageProvider>
          <Header />
          <AdherenceBadge />
          <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
          <BottomNav />
          <HealthChatbot />
        </LanguageProvider>
      </body>
    </html>
  );
}