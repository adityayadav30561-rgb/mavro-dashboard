// Only the 3 families the redesign actually renders are loaded as webfonts:
// Instrument Serif (headlines), Geist (UI/body), JetBrains Mono (labels). The
// design system's fallback chain still NAMES "DM Serif Display" / "Sora" for
// graceful degradation, but those are no longer fetched — the browser falls
// through to Georgia / system-ui. Trimmed from 5 → 3 webfonts to cut LCP.
import {
  Instrument_Serif,
  Geist,
  JetBrains_Mono,
} from "next/font/google";
import "../styles/spanbix-redesign.css";
import "./globals.css";
import { GtmScript, GtmNoScript } from "@/components/GoogleTagManager";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://www.spanbix.com"),
  title: "Spanbix",
  description: "SAP careers, built for graduates.",
};

const fontVars = [
  instrumentSerif.variable,
  geist.variable,
  jetbrainsMono.variable,
].join(" ");

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVars}>
      <body className="spanbix-scope">
        <GtmNoScript />
        {children}
        <GtmScript />
      </body>
    </html>
  );
}
