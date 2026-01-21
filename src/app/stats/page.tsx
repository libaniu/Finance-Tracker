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
  Calendar,
  Download,
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
// IMPORT LIBRARY BARU
import * as XLSX from "xlsx";

// --- TYPES ---
interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

const CATEGORY_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"];

export default function StatsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Filter Bulan (Default: Bulan Ini)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from("transactions").select("*");
      if (error) throw error;
      if (data) setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC FILTER ---
  const filteredTransactions = transactions.filter((t) => 
    t.date.startsWith(selectedMonth)
  );

  // --- LOGIC EXPORT EXCEL DENGAN AUTO-WIDTH (UPDATE) ---
  const downloadExcel = () => {
    if (filteredTransactions.length === 0) return;

    // 1. Siapkan Data yang Rapi
    const dataToExport = filteredTransactions.map(t => {
      const dateObj = new Date(t.date);
      return {
        Date: dateObj.toLocaleDateString("en-GB"), // DD/MM/YYYY
        Time: dateObj.toLocaleTimeString("en-GB", {hour: '2-digit', minute:'2-digit'}),
        Title: t.title,
        Category: t.category,
        Type: t.type.toUpperCase(),
        Amount: t.amount // Biarkan angka agar bisa dijumlah di Excel
      };
    });

    // 2. Buat Worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // 3. LOGIC PENTING: Hitung Lebar Kolom Otomatis
    // Kita cari teks terpanjang di setiap kolom (Header vs Isi Data)
    const columnWidths = Object.keys(dataToExport[0]).map(key => {
      // Hitung panjang header
      let maxLength = key.length; 

      // Bandingkan dengan panjang isi data di kolom tersebut
      dataToExport.forEach((row: any) => {
        const cellLength = (row[key] ? row[key].toString() : "").length;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });

      // Tambahkan sedikit padding (+2) agar tidak terlalu mepet
      return { wch: maxLength + 5 }; 
    });

    // Terapkan lebar kolom ke worksheet
    worksheet["!cols"] = columnWidths;

    // 4. Buat Workbook dan Download
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    
    // Simpan file dengan ekstensi .xlsx
    XLSX.writeFile(workbook, `Report_${selectedMonth}.xlsx`);
  };

  // --- LOGIC CHARTS ---
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  
  const summaryData = [
    { name: 'Income', value: totalIncome },
    { name: 'Expense', value: totalExpense },
  ];

  const expensesByCategory = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc: any, curr) => {
      const cat = curr.category || "Others";
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += curr.amount;
      return acc;
    }, {});

  const expenseChartData = Object.keys(expensesByCategory)
    .map((key) => ({ name: key, value: expensesByCategory[key] }))
    .sort((a, b) => b.value - a.value);

  const incomeByCategory = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((acc: any, curr) => {
      const cat = curr.category || "Others";
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += curr.amount;
      return acc;
    }, {});

  const incomeChartData = Object.keys(incomeByCategory)
    .map((key) => ({ name: key, value: incomeByCategory[key] }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center">
      <div className="fixed inset-0 w-full max-w-md bg-slate-50 h-dvh flex flex-col overflow-hidden shadow-2xl overscroll-none mx-auto">
        
        {/* HEADER */}
        <header className="flex-none bg-blue-600 px-6 pt-8 pb-6 rounded-b-4xl text-white shadow-md z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-2xl font-bold">Statistics</h1>
            </div>
            
            {/* BUTTON DOWNLOAD */}
            <button 
              onClick={downloadExcel} // Panggil fungsi Excel baru
              disabled={filteredTransactions.length === 0}
              className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition disabled:opacity-50"
              title="Download Excel Report"
            >
              <Download size={24} />
            </button>
          </div>

          {/* FILTER INPUT */}
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl flex items-center gap-3 border border-white/20">
            <div className="p-2 bg-white/20 rounded-lg text-white">
              <Calendar size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-blue-100 font-medium">Select Period</p>
              <input 
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-transparent text-white font-bold text-sm focus:outline-none appearance-none [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 px-6 pt-6 pb-6 overflow-y-auto overscroll-y-auto scroll-smooth">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm mb-2">No data in this period.</p>
              <p className="text-xs text-gray-300">Try selecting a different month.</p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              
              {/* 1. FINANCIAL SUMMARY */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-1 text-center">Financial Overview</h3>
                <p className="text-xs text-gray-400 text-center mb-4">
                  {new Date(selectedMonth).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </p>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summaryData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip formatter={(value: any) => `Rp ${value.toLocaleString("id-ID")}`} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. INCOME CHART */}
              {incomeChartData.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 text-center">Income Sources</h3>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeChartData}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {incomeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `Rp ${value.toLocaleString("id-ID")}`} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {incomeChartData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}></div>
                          <span className="text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-bold text-gray-800">Rp {item.value.toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. EXPENSE CHART */}
              {expenseChartData.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 text-center">Expense Breakdown</h3>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseChartData}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={70}
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
                  <div className="mt-4 space-y-2">
                    {expenseChartData.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}></div>
                          <span className="text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-bold text-gray-800">Rp {item.value.toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </main>

        {/* NAVBAR */}
        <nav className="flex-none bg-white border-t border-gray-100 py-3 px-15 flex justify-between items-center z-40 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
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