import React from "react";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { PwaPrompt } from "@/components/pwa-prompt";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Bingo Arena | Modern Multiplayer Bingo",
  description: "Play modern multiplayer bingo with friends. A premium virtual coin experience.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#1a1625",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <PwaPrompt />
      </body>
    </html>
  );
}
