import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import localFont from "next/font/local";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

// Self-hosted (latin subset, from @fontsource/ibm-plex-sans, OFL) so builds don't depend on Google Fonts.
const plex = localFont({
  src: [
    { path: "./fonts/plex-sans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/plex-sans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/plex-sans-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/plex-sans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plex",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
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
