import {
  Instrument_Serif,
  Geist,
  JetBrains_Mono,
  DM_Serif_Display,
  Sora,
} from "next/font/google";
import "../styles/spanbix-redesign.css";
import "./globals.css";

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

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://spanbix.com"),
  title: "Spanbix",
  description: "SAP careers, built for graduates.",
};

const fontVars = [
  instrumentSerif.variable,
  geist.variable,
  jetbrainsMono.variable,
  dmSerifDisplay.variable,
  sora.variable,
].join(" ");

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVars}>
      <body className="spanbix-scope">{children}</body>
    </html>
  );
}
