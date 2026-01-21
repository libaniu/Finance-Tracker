import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 1. KONFIGURASI METADATA & MANIFEST
export const metadata: Metadata = {
  title: "My Wallet",
  description: "Simple Personal Finance Tracker",
  manifest: "/manifest.json", // Link ke file manifest
  icons: {
    icon: "/icon-192x192.png", // Icon di tab browser
    apple: "/icon-192x192.png", // Icon di iPhone
  },
};

// 2. KONFIGURASI VIEWPORT (Wajib untuk PWA di HP)
export const viewport: Viewport = {
  themeColor: "#2563eb", // Warna biru status bar HP (sesuai header)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Biar user gak bisa zoom-in/out sembarangan
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}