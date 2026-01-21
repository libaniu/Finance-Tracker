import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Myllet",
  description: "Personal Finance Tracker",
};

// Interface untuk props layout
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {/* Wrapper agar tampilan di tengah seperti HP */}
        <div className="flex justify-center min-h-screen bg-slate-100">
          <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}