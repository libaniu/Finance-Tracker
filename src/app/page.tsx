"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  PieChart,
  Plus,
  Loader2,
  X,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  Calendar,
  Clock,
  Pencil,
  Search,
  Settings,
  Bot,
  Sparkles,
  Home,
  AlertCircle,
  ChevronDown,
  Filter,
  // --- ICON UPDATE ---
  CircleArrowUp,
  CircleArrowDown,
  // --- ICON KATEGORI ---
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  TrendingUp,
  MoreHorizontal,
  Banknote,
  Gift,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// --- TYPES ---
interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

const EXPENSE_CATEGORIES = [
  "Food & Beverage",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health",
  "Invest",
  "Others",
];
const INCOME_CATEGORIES = ["Salary", "Bonus", "Gift", "Investment", "Others"];

const ITEMS_PER_PAGE = 20;

// --- HELPER: ICON KATEGORI DINAMIS ---
const getCategoryIcon = (category: string, type: "income" | "expense") => {
  if (type === "income") {
    switch (category) {
      case "Salary":
        return <Banknote size={20} />;
      case "Bonus":
        return <Gift size={20} />;
      case "Investment":
        return <TrendingUp size={20} />;
      default:
        return <CircleArrowUp size={20} />;
    }
  } else {
    switch (category) {
      case "Food & Beverage":
        return <Utensils size={20} />;
      case "Transportation":
        return <Car size={20} />;
      case "Shopping":
        return <ShoppingBag size={20} />;
      case "Bills & Utilities":
        return <Zap size={20} />;
      case "Entertainment":
        return <Film size={20} />;
      case "Health":
        return <HeartPulse size={20} />;
      case "Invest":
        return <TrendingUp size={20} />;
      default:
        return <MoreHorizontal size={20} />;
    }
  }
};

// --- HELPER: FORMAT HEADER TANGGAL PINTAR ---
const getGroupHeaderDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dateStr = date.toDateString();
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();

  if (dateStr === todayStr) return "Hari Ini";
  if (dateStr === yesterdayStr) return "Kemarin";

  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: today.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
  });
};

export default function HomePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [isScrolled, setIsScrolled] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const observerTarget = useRef<HTMLDivElement>(null);

  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [tempBudget, setTempBudget] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const [sortBy, setSortBy] = useState("date-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    id: number | null;
  }>({ show: false, id: null });
  const [detailModal, setDetailModal] = useState<Transaction | null>(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
    type: "expense" as "income" | "expense",
  });

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchSummary = useCallback(async () => {
    try {
      let query = supabase.from("transactions").select("amount, type");

      if (selectedMonth) {
        const [year, month] = selectedMonth.split("-");
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0)
          .toISOString()
          .split("T")[0];

        query = query.gte("date", startDate).lte("date", `${endDate}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;

      let inc = 0;
      let exp = 0;
      data?.forEach((item: any) => {
        if (item.type === "income") inc += item.amount;
        else exp += item.amount;
      });

      setSummary({
        income: inc,
        expense: exp,
        balance: inc - exp,
      });
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, [selectedMonth]);

  const fetchTransactions = useCallback(
    async (pageNum: number, isRefresh = false) => {
      try {
        if (pageNum === 0) setIsLoading(true);
        else setIsLoadingMore(true);

        const from = pageNum * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        let query = supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false })
          .range(from, to);

        if (selectedMonth) {
          const [year, month] = selectedMonth.split("-");
          const startDate = `${year}-${month}-01`;
          const endDate = new Date(parseInt(year), parseInt(month), 0)
            .toISOString()
            .split("T")[0];

          query = query
            .gte("date", startDate)
            .lte("date", `${endDate}T23:59:59`);
        }

        if (searchQuery) {
          query = query.ilike("title", `%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          if (isRefresh || pageNum === 0) {
            setTransactions(data);
          } else {
            setTransactions((prev) => [...prev, ...data]);
          }

          if (data.length < ITEMS_PER_PAGE) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery, selectedMonth],
  );

  useEffect(() => {
    const savedBudget = localStorage.getItem("monthlyBudget");
    if (savedBudget) setMonthlyBudget(Number(savedBudget));
  }, []);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchSummary();
    fetchTransactions(0, true);
  }, [searchQuery, selectedMonth, fetchTransactions, fetchSummary]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isLoading
        ) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchTransactions(nextPage, false);
        }
      },
      { threshold: 0.5 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoadingMore, isLoading, page, fetchTransactions]);

  const handleAskAI = async () => {
    setIsAnalyzing(true);
    try {
      const { data: topExpenses } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "expense")
        .order("amount", { ascending: false })
        .limit(5);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: topExpenses || [],
          summary: summary,
        }),
      });

      const data = await response.json();
      if (data.advice) {
        setAiAdvice(data.advice);
        setIsAiModalOpen(true);
      } else {
        showToast(data.advice || "AI sedang sibuk.", "error");
      }
    } catch (error) {
      showToast("Gagal menghubungi AI.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  const saveBudget = () => {
    const value = Number(tempBudget.replace(/\D/g, ""));
    if (value > summary.income) {
      showToast(
        `Budget melebihi Income (${formatCurrency(summary.income)})`,
        "error",
      );
      return;
    }
    setMonthlyBudget(value);
    localStorage.setItem("monthlyBudget", value.toString());
    setIsBudgetModalOpen(false);
    showToast("Budget updated!", "success");
  };

  const budgetPercentage =
    monthlyBudget > 0
      ? Math.min((summary.expense / monthlyBudget) * 100, 100)
      : 0;
  let progressColor = "bg-blue-600";
  if (budgetPercentage > 50) progressColor = "bg-yellow-500";
  if (budgetPercentage > 85) progressColor = "bg-red-500";

  const processedTransactions = [...transactions].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return (
          new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id
        );
      case "date-asc":
        return (
          new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id
        );
      case "amount-high":
        return b.amount - a.amount;
      case "amount-low":
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  // --- GROUPING LOGIC (BY LOCAL DATE) ---
  const groupedTransactionsList = useMemo(() => {
    const groups: { date: string; items: Transaction[] }[] = [];

    processedTransactions.forEach((transaction) => {
      const tDate = new Date(transaction.date);
      const dateKey = tDate.toLocaleDateString("en-CA"); // YYYY-MM-DD Local

      const lastGroup = groups[groups.length - 1];
      const lastGroupKey = lastGroup
        ? new Date(lastGroup.date).toLocaleDateString("en-CA")
        : "";

      if (lastGroup && lastGroupKey === dateKey) {
        lastGroup.items.push(transaction);
      } else {
        groups.push({ date: transaction.date, items: [transaction] });
      }
    });
    return groups;
  }, [processedTransactions]);

  const handleEdit = (item: Transaction) => {
    setEditingId(item.id);
    const dateString = new Date(item.date).toISOString().split("T")[0];
    setFormData({
      title: item.title,
      amount: item.amount.toString(),
      category: item.category,
      date: dateString,
      type: item.type,
    });
    setIsDrawerOpen(true);
  };

  const resetForm = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData({
      title: "",
      amount: "",
      category: "",
      date: today,
      type: "expense",
    });
    setEditingId(null);
    setIsDrawerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.date) return;
    setIsSubmitting(true);
    const now = new Date();
    const selectedDate = new Date(formData.date);
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    const payload = {
      title: formData.title,
      amount: Number(formData.amount),
      type: formData.type,
      category: formData.category || "Others",
      date: selectedDate.toISOString(),
    };
    try {
      if (editingId) {
        const { error } = await supabase
          .from("transactions")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        showToast("Transaction updated!", "success");
      } else {
        const { error } = await supabase.from("transactions").insert([payload]);
        if (error) throw error;
        showToast("Transaction saved!", "success");
      }
      resetForm();
      fetchSummary();
      setPage(0);
      fetchTransactions(0, true);
    } catch (error) {
      showToast("Failed to save.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteModal.id) return;
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", deleteModal.id);
      if (error) throw error;

      fetchSummary();
      setTransactions((prev) => prev.filter((t) => t.id !== deleteModal.id));

      showToast("Deleted successfully.", "success");
    } catch (error) {
      showToast("Failed to delete.", "error");
    } finally {
      setDeleteModal({ show: false, id: null });
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, amount: e.target.value.replace(/\D/g, "") });
  const displayAmount = formData.amount
    ? new Intl.NumberFormat("id-ID").format(Number(formData.amount))
    : "";
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  const formatFullDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen flex justify-center">
      <div className="fixed inset-0 w-full max-w-md bg-slate-50 dark:bg-slate-900 h-dvh flex flex-col overflow-hidden sm:shadow-2xl overscroll-none mx-auto">
        {/* HEADER */}
        <header className="flex-none bg-linear-to-br from-blue-600 to-cyan-600 dark:from-blue-900 dark:to-cyan-950 px-6 pt-8 pb-8 rounded-b-[2.5rem] text-white relative z-10 shadow-xl overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-[-20%] right-[-10%] w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-1 opacity-90">
                  Total Balance
                </p>
                <h1 className="text-4xl font-extrabold tracking-tight">
                  {isLoading ? (
                    <div className="h-10 w-40 bg-white/20 rounded animate-pulse"></div>
                  ) : (
                    formatCurrency(summary.balance)
                  )}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAskAI}
                  disabled={isAnalyzing}
                  className="bg-white/15 p-2.5 rounded-2xl backdrop-blur-md hover:bg-white/25 transition active:scale-95 disabled:opacity-50 relative group border border-white/10 shadow-sm"
                >
                  {isAnalyzing ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Bot size={20} />
                  )}
                  {!isAnalyzing && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse border-2 border-blue-600"></span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setTempBudget(monthlyBudget.toString());
                    setIsBudgetModalOpen(true);
                  }}
                  className="bg-white/15 p-2.5 rounded-2xl backdrop-blur-md hover:bg-white/25 transition active:scale-95 border border-white/10 shadow-sm"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Income Card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden group hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-400/20 p-2 rounded-full text-green-300 shrink-0">
                    <CircleArrowUp size={18} />
                  </div>
                  <p className="text-xs text-indigo-100 font-medium">Income</p>
                </div>
                <p className="font-bold text-lg text-white truncate tracking-wide">
                  {isLoading ? "..." : formatCurrency(summary.income)}
                </p>
              </div>

              {/* Expense Card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden group hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-red-400/20 p-2 rounded-full text-red-300 shrink-0">
                    <CircleArrowDown size={18} />
                  </div>
                  <p className="text-xs text-indigo-100 font-medium">Expense</p>
                </div>
                <p className="font-bold text-lg text-white truncate tracking-wide">
                  {isLoading ? "..." : formatCurrency(summary.expense)}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main
          ref={mainRef}
          onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 20)}
          className="flex-1 px-6 pt-6 pb-32 overflow-y-auto overscroll-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        >
          {monthlyBudget > 0 && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-700 dark:text-slate-200">
                  Monthly Budget
                </span>
                <span className="text-xs font-medium text-gray-700 dark:text-slate-200">
                  {Math.round(budgetPercentage)}% used
                </span>
              </div>
              <div className="h-3 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all duration-500 ease-out`}
                  style={{ width: `${budgetPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400 dark:text-slate-500">
                <span>Used: {formatCurrency(summary.expense)}</span>
                <span>Limit: {formatCurrency(monthlyBudget)}</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search transaction..."
                className="w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 pl-10 pr-4 py-3 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 shadow-sm placeholder:text-gray-300 dark:placeholder:text-slate-500 text-gray-900 dark:text-slate-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-row gap-2 mb-6 w-full">
            <div className="relative w-[65%]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 pointer-events-none">
                <Filter size={14} />
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-xs font-semibold pl-9 pr-2 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 shadow-sm appearance-none min-w-0 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 dark:[&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>

            <div className="relative w-[35%]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 pointer-events-none">
                <ArrowUpDown size={14} />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-xs font-semibold pl-9 pr-8 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 shadow-sm truncate"
              >
                <option value="date-desc">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="amount-high">Highest</option>
                <option value="amount-low">Lowest</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* LIST TRANSACTIONS */}
          {isLoading && page === 0 ? (
            <div className="space-y-3 pb-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-50 dark:border-slate-700 shadow-sm animate-pulse"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-full shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="w-16 h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : processedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-full mb-4 shadow-sm border border-gray-100 dark:border-slate-700">
                <Wallet
                  size={48}
                  className="text-gray-300 dark:text-slate-600"
                />
              </div>
              <p className="text-gray-500 dark:text-slate-400 font-medium">
                No transactions yet
              </p>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 max-w-50">
                Start adding your expenses or income to see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {groupedTransactionsList.map((group) => (
                <div key={group.date}>
                  <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
                    {getGroupHeaderDate(group.date)}
                  </h3>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    {group.items.map((item, index) => (
                      <div key={item.id}>
                        <div
                          onClick={() => setDetailModal(item)}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer active:bg-gray-100 dark:active:bg-slate-700"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0 pr-2">
                            <div
                              className={`w-10 h-10 flex items-center justify-center rounded-full shrink-0 ${
                                item.type === "income"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {getCategoryIcon(item.category, item.type)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate leading-tight mb-0.5">
                                {item.title}
                              </h3>
                              <span className="text-xs text-gray-400 dark:text-slate-500 truncate">
                                {item.category || "Others"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <p
                              className={`font-bold text-sm whitespace-nowrap ${
                                item.type === "income"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-900 dark:text-slate-100"
                              }`}
                            >
                              {item.type === "expense" && "- "}
                              {formatCurrency(item.amount)}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(item);
                                }}
                                className="text-gray-400 hover:text-blue-600 p-1"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModal({ show: true, id: item.id });
                                }}
                                className="text-gray-400 hover:text-red-500 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                        {index < group.items.length - 1 && (
                          <div className="h-px bg-gray-100 dark:bg-slate-700 mx-4"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {hasMore && (
                <div
                  ref={observerTarget}
                  className="w-full py-4 flex justify-center items-center"
                >
                  {isLoadingMore && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-slate-500">
                      <Loader2 size={16} className="animate-spin" />
                      Loading more...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* FAB (Floating Action Button) */}
        <div className="absolute bottom-28 right-6 z-50">
          <button
            onClick={() => {
              resetForm();
              setIsDrawerOpen(true);
            }}
            className="bg-linear-to-r from-blue-600 to-cyan-600 text-white h-14 w-14 rounded-full shadow-lg shadow-blue-600/40 dark:shadow-blue-900/40 flex items-center justify-center transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/50 active:scale-90"
          >
            <Plus size={32} />
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-auto">
          <nav className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border border-white/20 dark:border-slate-700 p-1.5 rounded-full flex items-center gap-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-black/50 ring-1 ring-black/5">
            <button
              onClick={scrollToTop}
              className={`flex items-center bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-full transition-all duration-300 active:scale-95 shadow-sm shadow-blue-100 dark:shadow-none ${isScrolled ? "px-3 py-3" : "px-5 py-3"}`}
            >
              <Home
                size={20}
                strokeWidth={2.5}
                fill="currentColor"
                className="opacity-90"
              />
              <span
                className={`text-sm font-bold overflow-hidden whitespace-nowrap transition-all duration-300 ${isScrolled ? "max-w-0 opacity-0" : "max-w-xs opacity-100 ml-2"}`}
              >
                Home
              </span>
            </button>
            <Link
              href="/stats"
              className={`flex items-center text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-full transition-all duration-300 active:scale-95 ${isScrolled ? "px-3 py-3" : "px-5 py-3"}`}
            >
              <PieChart size={20} strokeWidth={2.5} />
              <span
                className={`text-sm font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ${isScrolled ? "max-w-0 opacity-0" : "max-w-xs opacity-100 ml-2"}`}
              >
                Stats
              </span>
            </Link>
          </nav>
        </div>

        {/* --- AI ADVISOR MODAL --- */}
        {isAiModalOpen && (
          <div
            className="absolute inset-0 z-100 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAiModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 relative animate-in zoom-in-95 duration-300 shadow-2xl flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4 border-b border-gray-100 dark:border-slate-700 pb-4 shrink-0">
                <div className="bg-linear-to-tr from-blue-600 to-cyan-600 p-3 rounded-full text-white shadow-lg shadow-blue-600/30">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 leading-none">
                    Financial Advisor
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                    Powered by Gemini AI
                  </p>
                </div>
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="ml-auto bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 p-2 rounded-full text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto text-sm text-gray-700 dark:text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap pr-2 mb-4 custom-scrollbar">
                <ReactMarkdown
                  components={{
                    strong: ({ node, ...props }) => (
                      <span
                        className="font-bold text-gray-900 dark:text-slate-100"
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc pl-5 space-y-1" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal pl-5 space-y-1" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="pl-1" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="mb-2" {...props} />
                    ),
                  }}
                >
                  {aiAdvice}
                </ReactMarkdown>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="w-full bg-gray-900 dark:bg-gray-700 text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-600 active:scale-[0.98] transition-all shrink-0 shadow-lg"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {/* --- BUDGET MODAL --- */}
        {isBudgetModalOpen && (
          <div
            className="absolute inset-0 z-80 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsBudgetModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-slate-800 w-full max-w-xs p-6 rounded-2xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 text-center">
                Set Monthly Budget
              </h3>
              <input
                type="text"
                inputMode="numeric"
                className="w-full bg-gray-50 dark:bg-slate-700 p-3 rounded-xl font-bold text-lg text-gray-800 dark:text-slate-100 text-center focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 mb-2"
                placeholder="e.g. 2000000"
                value={
                  tempBudget
                    ? new Intl.NumberFormat("id-ID").format(
                        Number(tempBudget.replace(/\D/g, "")),
                      )
                    : ""
                }
                onChange={(e) => setTempBudget(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-gray-400 dark:text-slate-500 text-center mb-4">
                Maksimal:{" "}
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {formatCurrency(summary.income)}
                </span>
              </p>
              <button
                onClick={saveBudget}
                className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition active:scale-95"
              >
                Save Budget
              </button>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toast.show && (
          <div
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-90 transition-all duration-300 ${
              toast.show
                ? "opacity-100 scale-100"
                : "opacity-0 scale-90 pointer-events-none"
            }`}
          >
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-xl ${
                toast.type === "success"
                  ? "bg-black dark:bg-gray-700 text-white"
                  : "bg-red-500 dark:bg-red-600 text-white"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        {detailModal && (
          <div className="fixed inset-0 z-70 flex items-center justify-center px-4 animate-in fade-in duration-200">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDetailModal(null)}
            ></div>
            <div className="bg-white dark:bg-slate-800 w-full max-w-xs p-6 rounded-3xl shadow-2xl relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-200">
              <div
                className={`p-4 rounded-full mb-4 ${detailModal.type === "income" ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400" : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"}`}
              >
                {getCategoryIcon(detailModal.category, detailModal.type)}
              </div>
              <h3 className="text-gray-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">
                {detailModal.type === "income" ? "Income" : "Expense"}
              </h3>
              <h2
                className={`text-2xl font-bold mb-6 ${detailModal.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {detailModal.type === "expense" && "- "}
                {formatCurrency(detailModal.amount)}
              </h2>
              <div className="w-full space-y-4 bg-gray-50 dark:bg-slate-700 p-4 rounded-xl border border-gray-100 dark:border-slate-600">
                <div className="flex justify-between items-start">
                  <span className="text-gray-400 dark:text-slate-400 text-xs font-medium">
                    Title
                  </span>
                  <span className="text-gray-800 dark:text-slate-100 text-sm font-bold text-right max-w-37.5 wrap-break-word">
                    {detailModal.title}
                  </span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-slate-600"></div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-400">
                    <Tag size={14} />
                    <span className="text-xs font-medium">Category</span>
                  </div>
                  <span className="text-gray-800 dark:text-slate-100 text-sm font-semibold">
                    {detailModal.category || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-400">
                    <Calendar size={14} />
                    <span className="text-xs font-medium">Date</span>
                  </div>
                  <span className="text-gray-800 dark:text-slate-100 text-sm font-semibold">
                    {formatFullDate(detailModal.date)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-400">
                    <Clock size={14} />
                    <span className="text-xs font-medium">Time</span>
                  </div>
                  <span className="text-gray-800 dark:text-slate-100 text-sm font-semibold">
                    {formatTime(detailModal.date)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="mt-6 w-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-100 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {deleteModal.show && (
          <div className="absolute inset-0 z-80 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteModal({ show: false, id: null })}
            ></div>
            <div className="bg-white dark:bg-slate-800 w-full max-w-xs p-6 rounded-2xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full text-red-600 dark:text-red-400 mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">
                  Delete Transaction?
                </h3>
                <div className="flex gap-3 w-full mt-4">
                  <button
                    onClick={() => setDeleteModal({ show: false, id: null })}
                    className="flex-1 py-2.5 rounded-xl text-gray-700 dark:text-slate-200 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeDelete}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 dark:bg-red-700 text-white font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isDrawerOpen && (
          <div className="absolute inset-0 z-60 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={resetForm}
            ></div>
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 relative z-10 animate-in zoom-in-95 duration-300 shadow-2xl border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                  {editingId ? "Edit Transaction" : "New Transaction"}
                </h3>
                <button
                  onClick={resetForm}
                  className="bg-gray-100 dark:bg-slate-700 p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Toggle - Compact */}
                <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-xl flex">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "expense" })
                    }
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      formData.type === "expense"
                        ? "bg-white dark:bg-slate-800 text-red-500 shadow-sm"
                        : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "income" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      formData.type === "income"
                        ? "bg-white dark:bg-slate-800 text-green-500 shadow-sm"
                        : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                    }`}
                  >
                    Income
                  </button>
                </div>

                {/* Amount Input - Big & Center */}
                <div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      className="w-full bg-transparent border-b-2 border-gray-200 dark:border-slate-700 py-2 pl-12 pr-4 text-3xl font-bold text-gray-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-300"
                      value={displayAmount}
                      onChange={handleAmountChange}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <input
                    type="text"
                    placeholder="What is this for?"
                    className="w-full bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl font-medium text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 placeholder:text-gray-400 text-sm"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Date & Category Group */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="date"
                      className="w-full bg-gray-50 dark:bg-slate-700/50 p-3 pl-9 rounded-xl font-medium text-sm text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="relative">
                    <Tag
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full bg-gray-50 dark:bg-slate-700/50 p-3 pl-9 rounded-xl font-medium text-sm text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 appearance-none"
                      required
                    >
                      <option value="" disabled>
                        Category
                      </option>
                      {formData.type === "expense"
                        ? EXPENSE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))
                        : INCOME_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-linear-to-r from-blue-600 to-cyan-600 dark:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm mt-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                      ? "Update Transaction"
                      : "Save Transaction"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
