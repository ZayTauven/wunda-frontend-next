import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Wunda Console",
  description: "Infrastructure de coordination économique observable",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${hanken.variable} ${jetbrains.variable} h-full`}>
      <head>
        <style>{`
          :root {
            --font: var(--font-hanken), system-ui, -apple-system, sans-serif;
            --mono: var(--font-jetbrains), ui-monospace, "SF Mono", monospace;
          }
        `}</style>
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
