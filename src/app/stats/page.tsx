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
  date: string;
}

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

  // --- LOGIC 1: PIE CHART (Income vs Expense) ---
  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pieData = [
    { name: "Income", value: incomeTotal || 0 },
    { name: "Expense", value: expenseTotal || 0 },
  ];

  // --- LOGIC 2: BAR CHART (Top 5 Expenses) ---
  const topExpenses = transactions
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // --- LOGIC 3: BAR CHART (Top 5 Incomes) ---
  const topIncomes = transactions
    .filter((t) => t.type === "income")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    // 1. OUTER WRAPPER (Desktop Background)
    <div className="bg-gray-100 min-h-screen flex justify-center">
      
      {/* 2. MOBILE CONTAINER (Layout Flexbox) */}
      <div className="w-full max-w-md bg-slate-50 h-[100dvh] flex flex-col relative overflow-hidden shadow-2xl">
        
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
        <main className="flex-1 px-6 pt-6 pb-6 overflow-y-auto">
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
              
              {/* CHART 1: PIE CHART */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-4 text-center">Financial Summary</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" /> {/* Green */}
                        <Cell fill="#ef4444" /> {/* Red */}
                      </Pie>
                      <Tooltip formatter={(value: any) => `Rp ${value.toLocaleString("id-ID")}`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CHART 2: TOP 5 EXPENSES */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-2 text-center">Top 5 Expenses</h3>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topExpenses} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="title" 
                        type="category" 
                        width={110} 
                        tick={{fontSize: 10}}
                      />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        formatter={(value: any) => `Rp ${value.toLocaleString("id-ID")}`}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="#ef4444" // RED
                        radius={[0, 4, 4, 0]} 
                        barSize={20}
                        minPointSize={10} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CHART 3: TOP 5 INCOMES */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-2 text-center">Top 5 Incomes</h3>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topIncomes} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="title" 
                        type="category" 
                        width={110} 
                        tick={{fontSize: 10}}
                      />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        formatter={(value: any) => `Rp ${value.toLocaleString("id-ID")}`}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="#10b981" // GREEN
                        radius={[0, 4, 4, 0]} 
                        barSize={20}
                        minPointSize={10} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </main>

        {/* NAVBAR (Fixed Bottom) */}
        <nav className="flex-none bg-white border-t border-gray-100 py-3 px-8 flex justify-between items-center z-40 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
          <Link href="/" className="flex flex-col items-center text-gray-400 hover:text-blue-600 transition-colors">
            <Home size={24} />
            <span className="text-[10px] font-medium mt-1">Home</span>
          </Link>

          {/* Disabled Plus Button */}
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