"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation"; // Router untuk redirect
import {
  PieChart as PieIcon,
  Home,
  ArrowLeft,
  Loader2,
  Calendar,
  Download,
  ArrowRight,
  Banknote,
  Gift,
  TrendingUp,
  CircleArrowUp,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  MoreHorizontal,
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
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#64748b", // Slate (Others)
];

const getCategoryIcon = (category: string, type: "income" | "expense") => {
  if (type === "income") {
    switch (category) {
      case "Salary":
      case "Gaji":
        return <Banknote size={14} />;
      case "Bonus":
        return <Gift size={14} />;
      case "Gift":
      case "Hadiah":
        return <Gift size={14} />;
      case "Investment":
      case "Investasi":
        return <TrendingUp size={14} />;
      default:
        return <CircleArrowUp size={14} />;
    }
  } else {
    switch (category) {
      case "Food & Beverage":
      case "Makanan & Minuman":
        return <Utensils size={14} />;
      case "Transportation":
      case "Transportasi":
        return <Car size={14} />;
      case "Shopping":
      case "Belanja":
        return <ShoppingBag size={14} />;
      case "Bills & Utilities":
      case "Tagihan & Utilitas":
        return <Zap size={14} />;
      case "Entertainment":
      case "Hiburan":
        return <Film size={14} />;
      case "Health":
      case "Kesehatan":
        return <HeartPulse size={14} />;
      case "Invest":
      case "Investasi":
        return <TrendingUp size={14} />;
      default:
        return <MoreHorizontal size={14} />;
    }
  }
};

const getCategoryColor = (category: string, type: "income" | "expense") => {
  if (type === "income") {
    return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
  }
  switch (category) {
    case "Makanan & Minuman":
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400";
    case "Transportasi":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
    case "Belanja":
      return "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400";
    case "Tagihan & Utilitas":
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
    case "Hiburan":
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
    case "Kesehatan":
      return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
    case "Investasi":
      return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
  }
};

export default function StatsPage() {
  // --- AUTH STATE ---
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // --- STATE FILTER CUSTOM ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- THEME INIT ---
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // --- 1. AUTH CHECK & INIT DATA ---
  useEffect(() => {
    const initPage = async () => {
      // A. Cek User Login
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // B. Logic Pintar untuk Default Tanggal (Hanya jalan sekali saat mount)
      const now = new Date();
      const currentDay = now.getDate();
      let start, end;

      if (currentDay >= 20) {
        start = new Date(now.getFullYear(), now.getMonth(), 20);
        end = now;
      } else {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 20);
        end = now;
      }

      const formatToInput = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60 * 1000);
        return localDate.toISOString().split("T")[0];
      };

      setStartDate(formatToInput(start));
      setEndDate(formatToInput(end));
    };

    initPage();
  }, [router]);

  // Fetch data setiap kali startDate / endDate berubah
  useEffect(() => {
    if (user && startDate && endDate) {
      fetchData();
    }
  }, [user, startDate, endDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Optimasi: Filter langsung di database, bukan fetch all
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate + "T23:59:59");

      if (error) throw error;
      if (data) setTransactions(data); // Data sudah terfilter dari DB
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper Quick Filter
  const setQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const format = (d: Date) => {
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60 * 1000);
      return local.toISOString().split("T")[0];
    };

    setStartDate(format(start));
    setEndDate(format(end));
  };

  // Karena data sudah difilter dari DB, kita pakai transactions langsung
  const filteredTransactions = transactions;

  // --- LOGIC DAILY TREND (BAR CHART) ---
  const dailyTrendData = useMemo(() => {
    const map = new Map<
      string,
      { date: string; income: number; expense: number }
    >();

    filteredTransactions.forEach((t) => {
      const date = t.date.split("T")[0];
      if (!map.has(date)) {
        map.set(date, { date, income: 0, expense: 0 });
      }
      const entry = map.get(date)!;
      if (t.type === "income") entry.income += t.amount;
      else entry.expense += t.amount;
    });

    return Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [filteredTransactions]);

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
    XLSX.writeFile(workbook, `Myllet_Report_${startDate}_to_${endDate}.xlsx`);
  };

  // --- HELPER: Process Data for Chart ---
  const processChartData = (type: "income" | "expense") => {
    // 1. Group by Category
    const grouped = filteredTransactions
      .filter((t) => t.type === type)
      .reduce((acc: any, curr) => {
        const cat = curr.category || "Lainnya";
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += curr.amount;
        return acc;
      }, {});

    // 2. Convert to Array & Sort
    const sortedData = Object.keys(grouped)
      .map((key) => ({ name: key, value: grouped[key] }))
      .sort((a, b) => b.value - a.value);

    // 3. Logic "Others" Grouping (Kunci Kerapihan!)
    if (sortedData.length > 5) {
      const top5 = sortedData.slice(0, 5);
      const othersValue = sortedData
        .slice(5)
        .reduce((sum, item) => sum + item.value, 0);
      return [...top5, { name: "Lainnya", value: othersValue }];
    }

    return sortedData;
  };

  // Get Data
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const summaryData = [
    { name: "Pemasukan", value: totalIncome },
    { name: "Pengeluaran", value: totalExpense },
  ];

  const expenseChartData = processChartData("expense");
  const incomeChartData = processChartData("income");

  // Data List Detail (Full List tanpa grouping Others untuk list bawah)
  const fullExpenseList = Object.entries(
    filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc: any, curr) => {
        const cat = curr.category || "Lainnya";
        acc[cat] = (acc[cat] || 0) + curr.amount;
        return acc;
      }, {}),
  )
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  // Jika belum login / sedang loading user
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen flex justify-center">
      <div className="fixed inset-0 w-full max-w-md bg-slate-50 dark:bg-slate-900 h-dvh flex flex-col overflow-hidden sm:shadow-2xl overscroll-none mx-auto">
        {/* HEADER */}
        <header className="flex-none bg-linear-to-br from-blue-600 to-cyan-600 dark:from-blue-900 dark:to-cyan-900 px-6 pt-12 pb-10 rounded-b-[3rem] text-white relative z-10 shadow-xl overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-[-20%] right-[-10%] w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="bg-white/15 p-2.5 rounded-full backdrop-blur-md hover:bg-white/25 transition border border-white/10 shadow-sm"
                >
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Statistik</h1>
              </div>

              <button
                onClick={downloadExcel}
                disabled={filteredTransactions.length === 0}
                className="bg-white/15 p-2.5 rounded-full backdrop-blur-md hover:bg-white/25 transition disabled:opacity-50 border border-white/10 shadow-sm"
                title="Download Excel"
              >
                <Download size={20} />
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-indigo-100" />
                <p className="text-[10px] text-indigo-100 font-medium uppercase tracking-wider">
                  Periode Kustom
                </p>
              </div>

              {/* FIX: Layout Input Tanggal agar rapi di HP */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 min-w-0 bg-white/20 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/30 text-center [&::-webkit-calendar-picker-indicator]:invert transition-all hover:bg-white/30"
                />
                <span className="text-white/50 shrink-0">
                  <ArrowRight size={14} />
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 min-w-0 bg-white/20 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/30 text-center [&::-webkit-calendar-picker-indicator]:invert transition-all hover:bg-white/30"
                />
              </div>

              {/* Quick Filters */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                <button
                  onClick={() => setQuickFilter(30)}
                  className="py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition-colors border border-white/10 active:scale-95"
                >
                  30 Hari
                </button>
                <button
                  onClick={() => setQuickFilter(90)}
                  className="py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition-colors border border-white/10 active:scale-95"
                >
                  3 Bulan
                </button>
                <button
                  onClick={() => setQuickFilter(180)}
                  className="py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition-colors border border-white/10 active:scale-95"
                >
                  6 Bulan
                </button>
                <button
                  onClick={() => setQuickFilter(365)}
                  className="py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition-colors border border-white/10 active:scale-95"
                >
                  1 Tahun
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main
          onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 20)}
          className="flex-1 px-6 pt-6 pb-32 overflow-y-auto overscroll-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        >
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 dark:text-slate-500 text-sm mb-2">
                Tidak ada transaksi ditemukan.
              </p>
              <p className="text-xs text-gray-300 dark:text-slate-400">
                Coba sesuaikan tanggalnya.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {/* 1. FINANCIAL SUMMARY */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <h2 className="font-bold text-gray-800 dark:text-slate-100 mb-1 text-center">
                  Ringkasan Keuangan
                </h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 text-center mb-4 font-medium bg-gray-50 dark:bg-slate-700 inline-block px-3 py-1 rounded-full mx-auto">
                  {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
                </p>
                <div className="h-56 w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minHeight={100}
                    minWidth={0}
                  >
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
                          backgroundColor: "#fff",
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          color: "#333",
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

              {/* 2. DAILY TREND (BAR CHART) */}
              {dailyTrendData.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                  <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-4 text-center">
                    Tren Harian
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minHeight={100}
                      minWidth={0}
                    >
                      <BarChart
                        data={dailyTrendData}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(val) =>
                            new Date(val).getDate().toString()
                          }
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip
                          formatter={(value: any) =>
                            `Rp ${value.toLocaleString("id-ID")}`
                          }
                          labelFormatter={(label) =>
                            new Date(label).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                            })
                          }
                          contentStyle={{
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            color: "#333",
                          }}
                          cursor={{ fill: "transparent" }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                        />
                        <Bar
                          dataKey="income"
                          name="Pemasukan"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                        <Bar
                          dataKey="expense"
                          name="Pengeluaran"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 3. EXPENSE BREAKDOWN (OPTIMIZED) */}
              {expenseChartData.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                  <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-4 text-center">
                    Rincian Pengeluaran
                  </h3>

                  {/* GRAFIK */}
                  <div className="h-64 w-full mb-6">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minHeight={100}
                      minWidth={0}
                    >
                      <PieChart>
                        <Pie
                          data={expenseChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
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
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            color: "#333",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* LIST DETAIL (Scrollable) */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {fullExpenseList.map((item, idx) => {
                      const colorIndex =
                        idx < 5 ? idx : CATEGORY_COLORS.length - 1;
                      const barColor = CATEGORY_COLORS[colorIndex];
                      const percentage = (
                        (item.value / totalExpense) *
                        100
                      ).toFixed(1);

                      return (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${getCategoryColor(item.name, "expense")}`}
                              >
                                {getCategoryIcon(item.name, "expense")}
                              </div>
                              <span className="text-gray-700 dark:text-slate-300 font-medium truncate max-w-30">
                                {item.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-900 dark:text-white block">
                                Rp {item.value.toLocaleString("id-ID")}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: barColor,
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. INCOME SOURCES */}
              {incomeChartData.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                  <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-4 text-center">
                    Sumber Pemasukan
                  </h3>
                  <div className="h-56 w-full">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minHeight={100}
                      minWidth={0}
                    >
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
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            color: "#333",
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
              )}
            </div>
          )}
        </main>

        {/* NAVBAR */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 w-auto">
          <nav className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border border-white/20 dark:border-slate-700 p-1.5 rounded-full flex items-center gap-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-black/50 ring-1 ring-black/5">
            <Link
              href="/"
              className={`flex items-center text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-full transition-all duration-300 active:scale-95 ${isScrolled ? "px-3 py-3" : "px-5 py-3"}`}
            >
              <Home size={20} strokeWidth={2.5} />
              <span
                className={`text-sm font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ${isScrolled ? "max-w-0 opacity-0" : "max-w-xs opacity-100 ml-2"}`}
              >
                Beranda
              </span>
            </Link>
            <button
              className={`flex items-center bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-full transition-all duration-300 active:scale-95 shadow-sm shadow-blue-100 dark:shadow-none ${isScrolled ? "px-3 py-3" : "px-5 py-3"}`}
            >
              <PieIcon
                size={20}
                strokeWidth={2.5}
                fill="currentColor"
                className="opacity-90"
              />
              <span
                className={`text-sm font-bold overflow-hidden whitespace-nowrap transition-all duration-300 ${isScrolled ? "max-w-0 opacity-0" : "max-w-xs opacity-100 ml-2"}`}
              >
                Statistik
              </span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
