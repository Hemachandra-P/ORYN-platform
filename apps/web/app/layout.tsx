import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ORYN — Everything Shared. Everything Simple.",
  description: "One connected platform to manage shared living, organize household finances, and discover products within your community.",
  openGraph: {
    title: "ORYN — Everything Shared. Everything Simple.",
    description: "One connected platform to manage shared living, organize household finances, and discover products within your community.",
    siteName: "ORYN",
  },
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
