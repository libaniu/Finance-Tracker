import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-center px-4">
      <h1 className="text-6xl font-bold text-sky-700 dark:text-sky-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-200 mb-2">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-gray-500 dark:text-slate-400 mb-8">
        Sepertinya kamu tersesat saat mengejar uangmu.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 bg-sky-700 hover:bg-sky-800 text-white px-6 py-3 rounded-full transition-all"
      >
        <Home size={20} />
        Kembali ke Home
      </Link>
    </div>
  );
}