import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EarthWise — Crop Rotation Decision Support",
  description:
    "Explore crop-rotation strategies using NASA Earth observations and local soil data. Built for NASA Space Apps 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
        <footer className="mt-auto border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-500">
          <p>
            Climate data provided by{" "}
            <a
              href="https://power.larc.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              NASA Langley Research Center POWER Project
            </a>
            , funded through the NASA Earth Science Directorate Applied Science
            Program.
          </p>
          <p className="mt-1">
            Built for NASA Space Apps Challenge 2026 by Galactic HQ.
          </p>
          <p className="mt-1">
            This tool supports — and does not replace — farmers and local
            agricultural experts.
          </p>
        </footer>
      </body>
    </html>
  );
}
