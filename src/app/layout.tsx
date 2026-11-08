import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { LangProvider } from "@/lib/i18n";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Kasku", template: "%s · Kasku" },
  description: "Catat pengeluaran lebih cepat — cukup foto struknya.",
  applicationName: "Kasku",
  appleWebApp: { capable: true, title: "Kasku", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0B0E11",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={plex.variable}>
      <body>
        <LangProvider>
          {/* Forced mobile view at every screen size: one centered column, plain dark outside. */}
          <div className="app-shell relative mx-auto min-h-dvh max-w-[430px] border-x border-surface bg-bg">{children}</div>
        </LangProvider>
      </body>
    </html>
  );
}
