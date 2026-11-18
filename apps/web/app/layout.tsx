import "./globals.css";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Vyna — Everything Shared. Everything Simple.",
  description: "Split expenses, share chores and buy or sell second-hand in your flat, PG or hostel.",
  openGraph: {
    title: "Vyna — Everything Shared. Everything Simple.",
    description: "Split expenses, share chores and buy or sell second-hand in your flat, PG or hostel.",
    siteName: "Vyna",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-paper text-navy min-h-screen selection:bg-coral selection:text-white">{children}</body>
    </html>
  );
}
