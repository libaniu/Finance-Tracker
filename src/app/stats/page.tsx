"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import {
  PieChart as PieIcon,
  Home,
  Plus,
  ArrowLeft,
  Loader2,
  Calendar,
  Download,
  ArrowRight, // Icon baru untuk pemisah tanggal
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
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

const CATEGORY_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
];

export default function StatsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE FILTER CUSTOM (DEFAULT: PERIODE GAJIAN TGL 20) ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    // 1. Logic Pintar untuk Default Tanggal (Gajian tgl 20)
    const now = new Date();
    const currentDay = now.getDate();
    let start, end;

    if (currentDay >= 20) {
      // Jika hari ini tgl 20 ke atas (misal 23 Jan), berarti periode: 20 Jan - Hari Ini
      start = new Date(now.getFullYear(), now.getMonth(), 20);
      end = now;
    } else {
      // Jika hari ini belum tgl 20 (misal 10 Jan), berarti periode: 20 Des - Hari Ini
      start = new Date(now.getFullYear(), now.getMonth() - 1, 20);
      end = now;
    }

    // Format ke YYYY-MM-DD untuk input HTML
    // Menggunakan toLocaleDateString('en-CA') menghasilkan format YYYY-MM-DD yang konsisten
    const formatToInput = (date: Date) => {
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      return localDate.toISOString().split("T")[0];
    };

    setStartDate(formatToInput(start));
    setEndDate(formatToInput(end));

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

  // --- LOGIC FILTER (CUSTOM RANGE) ---
  const filteredTransactions = transactions.filter((t) => {
    // Ambil bagian tanggal saja (YYYY-MM-DD)
    const tDate = t.date.split("T")[0];
    return tDate >= startDate && tDate <= endDate;
  });

  // --- LOGIC EXPORT EXCEL ---
  const downloadExcel = () => {
    if (filteredTransactions.length === 0) return;

    const dataToExport = filteredTransactions.map((t) => {
      const dateObj = new Date(t.date);
      return {
        Date: dateObj.toLocaleDateString("en-GB"),
        Time: dateObj.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        Title: t.title,
        Category: t.category,
        Type: t.type.toUpperCase(),
        Amount: t.amount,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Auto-width columns
    const columnWidths = Object.keys(dataToExport[0]).map((key) => {
      let maxLength = key.length;
      dataToExport.forEach((row: any) => {
        const cellLength = (row[key] ? row[key].toString() : "").length;
        if (cellLength > maxLength) maxLength = cellLength;
      });
      return { wch: maxLength + 5 };
    });
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    // Nama file dinamis sesuai periode
    XLSX.writeFile(workbook, `Myllet_Report_${startDate}_to_${endDate}.xlsx`);
  };

  // --- LOGIC CHARTS ---
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const summaryData = [
    { name: "Income", value: totalIncome },
    { name: "Expense", value: totalExpense },
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

  // Helper untuk format tampilan tanggal di Card Overview
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-950 min-h-screen flex justify-center">
      <div className="fixed inset-0 w-full max-w-md bg-slate-50 dark:bg-slate-900 h-dvh flex flex-col overflow-hidden shadow-2xl overscroll-none mx-auto">
        {/* HEADER DENGAN CUSTOM DATE RANGE */}
        <header className="flex-none bg-sky-700 dark:bg-sky-800 px-6 pt-8 pb-6 rounded-b-4xl text-white shadow-md z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"
              >
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-2xl font-bold">Statistics</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadExcel}
                disabled={filteredTransactions.length === 0}
                className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition disabled:opacity-50"
                title="Download Excel"
              >
                <Download size={24} />
              </button>
              <ThemeToggle />
            </div>
          </div>

          {/* INPUT TANGGAL (GRID LAYOUT) */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-sky-100" />
              <p className="text-[10px] text-sky-100 font-medium uppercase tracking-wider">
                Custom Period
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white/20 rounded-lg px-2 py-1.5 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/30 text-center [&::-webkit-calendar-picker-indicator]:invert"
              />
              <span className="text-white/50">
                <ArrowRight size={14} />
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white/20 rounded-lg px-2 py-1.5 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/30 text-center [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 px-6 pt-6 pb-6 overflow-y-auto overscroll-y-auto scroll-smooth">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-sky-700" size={32} />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 dark:text-slate-500 text-sm mb-2">
                No transactions found.
              </p>
              <p className="text-xs text-gray-300 dark:text-slate-400">
                Try adjusting the dates.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {/* 1. FINANCIAL SUMMARY */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-1 text-center">
                  Financial Overview
                </h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 text-center mb-4 font-medium bg-gray-50 dark:bg-slate-700 inline-block px-3 py-1 rounded-full mx-auto">
                  {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
                </p>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summaryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip
                        formatter={(value: any) =>
                          `Rp ${value.toLocaleString("id-ID")}`
                        }
                        contentStyle={{
                          backgroundColor: "var(--bg-tooltip, #fff)",
                          border: "1px solid var(--border-tooltip, #e5e7eb)",
                          borderRadius: "8px",
                        }}
                        labelStyle={{
                          color: "var(--text-tooltip, #000)",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. INCOME CHART */}
              {incomeChartData.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                  <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-4 text-center">
                    Income Sources
                  </h3>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {incomeChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) =>
                            `Rp ${value.toLocaleString("id-ID")}`
                          }
                          contentStyle={{
                            backgroundColor: "var(--bg-tooltip, #fff)",
                            border: "1px solid var(--border-tooltip, #e5e7eb)",
                            borderRadius: "8px",
                          }}
                          labelStyle={{
                            color: "var(--text-tooltip, #000)",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {incomeChartData.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                            }}
                          ></div>
                          <span className="text-gray-600 dark:text-slate-400">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-bold text-gray-800 dark:text-slate-100">
                          Rp {item.value.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. EXPENSE CHART */}
              {expenseChartData.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                  <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-4 text-center">
                    Expense Breakdown
                  </h3>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {expenseChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) =>
                            `Rp ${value.toLocaleString("id-ID")}`
                          }
                          contentStyle={{
                            backgroundColor: "var(--bg-tooltip, #fff)",
                            border: "1px solid var(--border-tooltip, #e5e7eb)",
                            borderRadius: "8px",
                          }}
                          labelStyle={{
                            color: "var(--text-tooltip, #000)",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {expenseChartData.slice(0, 5).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                            }}
                          ></div>
                          <span className="text-gray-600 dark:text-slate-400">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-bold text-gray-800 dark:text-slate-100">
                          Rp {item.value.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* NAVBAR */}
        <nav className="flex-none bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 py-3 px-17 flex justify-between items-center z-40 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] dark:shadow-[0_-5px_10px_rgba(0,0,0,0.3)]">
          <Link
            href="/"
            className="flex flex-col items-center text-gray-400 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-400 transition-colors"
          >
            <Home size={24} />
            <span className="text-[10px] font-medium mt-1">Home</span>
          </Link>

          <div className="relative -top-8 opacity-20 cursor-not-allowed">
            <div className="bg-gray-400 dark:bg-slate-600 text-white h-14 w-14 rounded-full flex items-center justify-center">
              <Plus size={32} />
            </div>
          </div>

          <button className="flex flex-col items-center text-sky-700 dark:text-sky-400">
            <PieIcon size={24} />
            <span className="text-[10px] font-medium mt-1">Stats</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
