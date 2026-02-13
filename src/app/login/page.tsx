"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Sparkles,
  Lock,
  User,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState(""); // Ganti email jadi username
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const router = useRouter();

  // --- THEME HANDLER ---
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    console.log(
      `Tema: ${newMode ? "Dark" : "Light"} (Class 'dark' ${newMode ? "added" : "removed"})`,
    );
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // TRIK: Buat email palsu dari username agar Supabase mau menerimanya
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "");
    const dummyEmail = `${cleanUsername}@myllet.com`;

    try {
      if (isSignUp) {
        // --- LOGIC DAFTAR ---
        const { error } = await supabase.auth.signUp({
          email: dummyEmail,
          password,
          options: {
            // Simpan username asli (bisa ada spasi/huruf besar) buat ditampilkan nanti
            data: { display_name: username },
          },
        });
        if (error) throw error;
        setMessage({
          text: "Akun berhasil dibuat! Silakan login.",
          type: "success",
        });
        setIsSignUp(false);
      } else {
        // --- LOGIC LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password,
        });
        if (error) throw error;
        router.push("/");
      }
    } catch (error: any) {
      // Pesean error Supabase biasanya "Invalid login credentials"
      // Kita ubah bahasanya biar user ngerti
      let msg = error.message;
      if (msg.includes("Invalid login credentials"))
        msg = "Username atau password salah!";
      if (msg.includes("already registered"))
        msg = "Username ini sudah dipakai orang lain!";

      setMessage({ text: msg, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
        {/* Header */}
        <div className="bg-sky-700 p-8 text-center relative overflow-hidden">
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-all text-white active:scale-95"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-sky-600 to-purple-600 opacity-50"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Selamat Datang !
            </h1>
            <p className="text-sky-100 text-sm">
              Kelola keuanganmu dengan Myllet
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            {message && (
              <div
                className={`p-3 rounded-xl text-sm text-center font-medium ${
                  message.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Username
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all dark:text-white"
                  placeholder="Masukkan Username Anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="password"
                  required
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all dark:text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sky-700/30 active:scale-95 transition-all flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isSignUp ? "Daftar Akun" : "Masuk Sekarang"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {isSignUp ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage(null);
                }}
                className="text-sky-700 font-bold hover:underline"
              >
                {isSignUp ? "Login di sini" : "Daftar di sini"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
