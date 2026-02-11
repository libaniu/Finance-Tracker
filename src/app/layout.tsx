import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // Ganti dengan URL Vercel kamu yang sebenarnya
  metadataBase: new URL("https://wallet-bice-beta.vercel.app"),
  title: {
    default: "Myllet",
    template: "%s | Myllet",
  },
  description:
    "Kelola keuangan pribadi, catat pengeluaran harian, dan analisis budget dengan bantuan AI Financial Advisor.",
  keywords: [
    "finance tracker",
    "catat keuangan",
    "expense tracker",
    "money manager",
    "aplikasi keuangan",
    "Myllet",
  ],
  authors: [{ name: "Fahmi Nabil" }],
  creator: "Fahmi Nabil",

  // Konfigurasi untuk Social Media (Open Graph)
  openGraph: {
    title: "Myllet - Smart Finance Tracker",
    description: "Aplikasi pencatat keuangan cerdas dengan AI Advisor.",
    url: "https://wallet-bice-beta.vercel.app",
    siteName: "Myllet",
    locale: "id_ID",
    type: "website",
  },

  // Konfigurasi untuk Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Myllet - Smart Finance Tracker",
    description: "Catat dan pantau keuanganmu dengan mudah.",
  },

  // Konfigurasi Robots (agar di-index Google)
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
