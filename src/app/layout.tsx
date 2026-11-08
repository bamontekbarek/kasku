import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { IBM_Plex_Sans } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: "Kasku", template: "%s · Kasku" },
    description: t("description"),
    applicationName: "Kasku",
    appleWebApp: { capable: true, title: "Kasku", statusBarStyle: "black-translucent" },
    icons: { icon: "/icon.svg", apple: "/pwa-icon/180" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0B0E11",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={plex.variable}>
      <body>
        <NextIntlClientProvider>
          {/* Forced mobile view at every screen size: one centered column, plain dark outside. */}
          <div className="app-shell relative mx-auto min-h-dvh max-w-[430px] border-x border-surface bg-bg">{children}</div>
        </NextIntlClientProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
