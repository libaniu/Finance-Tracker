"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PieChart as PieIcon,
  Home,
  Plus,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// --- TYPES ---
interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

// Warna Palet untuk Kategori (Biar chart warna-warni)
const CATEGORY_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"];

export default function StatsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*");

      if (error) throw error;
      if (data) setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC 1: EXPENSE BY CATEGORY (Grouped for Pie Chart) ---
  // Mengelompokkan transaksi expense berdasarkan nama kategorinya
  const expensesByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc: any, curr) => {
      const cat = curr.category || "Others"; // Default category
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += curr.amount;
      return acc;
    }, {});

  // Format data untuk Recharts
  const expenseChartData = Object.keys(expensesByCategory)
    .map((key) => ({
      name: key,
      value: expensesByCategory[key],
    }))
    .sort((a, b) => b.value - a.value); // Urutkan dari yang terbesar

  // --- LOGIC 2: INCOME BY CATEGORY (Grouped for Bar Chart) ---
  const incomeByCategory = transactions
    .filter((t) => t.type === "income")
    .reduce((acc: any, curr) => {
      const cat = curr.category || "Others";
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += curr.amount;
      return acc;
    }, {});

  const incomeChartData = Object.keys(incomeByCategory)
    .map((key) => ({
      name: key,
      value: incomeByCategory[key],
    }))
    .sort((a, b) => b.value - a.value);

  return (
    // 1. OUTER WRAPPER (Sama seperti Home)
    <div className="bg-gray-100 min-h-screen flex justify-center">
      
      {/* 2. MOBILE CONTAINER (Fixed & Overscroll Fix) */}
      <div className="fixed inset-0 w-full max-w-md bg-slate-50 h-[100dvh] flex flex-col relative overflow-hidden shadow-2xl overscroll-none mx-auto">
        
        {/* HEADER */}
        <header className="flex-none bg-blue-600 px-6 pt-8 pb-6 rounded-b-[2rem] text-white shadow-md z-10">
          <div className="flex items-center gap-4">
            <Link href="/" className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold">Statistics</h1>
          </div>
        </header>

        {/* MAIN CONTENT (Scrollable) */}
        <main className="flex-1 px-6 pt-6 pb-6 overflow-y-auto overscroll-y-auto scroll-smooth">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 text-sm">
              No transactions found.
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              
              {/* CHART 1: EXPENSE PIE CHART (Porsi Pengeluaran) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-4 text-center">Expenses by Category</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `Rp ${value.toLocaleString("id-ID")}`} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CHART 2: EXPENSE BAR CHART (Detail Kategori) */}
              {expenseChartData.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-700 mb-2 text-center">Expense Breakdown</h3>
                  <div className="h-64 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expenseChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100} 
                          tick={{fontSize: 10}}
                        />
                        <Tooltip 
                          cursor={{fill: 'transparent'}}
                          formatter={(value: any) => `Rp ${value.toLocaleString("id-ID")}`}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#ef4444" 
                          radius={[0, 4, 4, 0]} 
                          barSize={20}
                          minPointSize={10} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

               {/* CHART 3: INCOME BAR CHART (Detail Pemasukan) */}
               {incomeChartData.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-700 mb-2 text-center">Income Breakdown</h3>
                  <div className="h-64 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomeChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100} 
                          tick={{fontSize: 10}}
                        />
                        <Tooltip 
                          cursor={{fill: 'transparent'}}
                          formatter={(value: any) => `Rp ${value.toLocaleString("id-ID")}`}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#10b981" 
                          radius={[0, 4, 4, 0]} 
                          barSize={20}
                          minPointSize={10} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
               )}

            </div>
          )}
        </main>

        {/* NAVBAR (Fixed Bottom) */}
        <nav className="flex-none bg-white border-t border-gray-100 py-3 px-8 flex justify-between items-center z-40 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
          <Link href="/" className="flex flex-col items-center text-gray-400 hover:text-blue-600 transition-colors">
            <Home size={24} />
            <span className="text-[10px] font-medium mt-1">Home</span>
          </Link>

          <div className="relative -top-8 opacity-20 cursor-not-allowed">
            <div className="bg-gray-400 text-white h-14 w-14 rounded-full flex items-center justify-center">
              <Plus size={32} />
            </div>
          </div>

          <button className="flex flex-col items-center text-blue-600">
            <PieIcon size={24} />
            <span className="text-[10px] font-medium mt-1">Stats</span>
          </button>
        </nav>

      </div>
    </div>
  );
}