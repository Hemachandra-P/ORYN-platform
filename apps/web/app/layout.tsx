import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NestSync — Unified Household Management & Community Marketplace",
  description: "Digital platform for flats, PGs, shared accommodations and student households. Shared expenses, shopping lists, tasks, AI assistant and second-hand marketplace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream text-navy min-h-screen selection:bg-coral selection:text-white">
        {children}
      </body>
    </html>
  );
}
