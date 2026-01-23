"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  PieChart,
  Plus,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
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

export default function HomePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Budget & AI States
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [tempBudget, setTempBudget] = useState("");

  // AI ADVISOR STATES
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // UI States
  const [sortBy, setSortBy] = useState("date-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Modal States
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

  useEffect(() => {
    fetchTransactions();
    const savedBudget = localStorage.getItem("monthlyBudget");
    if (savedBudget) setMonthlyBudget(Number(savedBudget));
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      if (data) {
        setTransactions(data);
        calculateSummary(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSummary = (data: Transaction[]) => {
    let inc = 0;
    let exp = 0;
    data.forEach((item) => {
      if (item.type === "income") inc += item.amount;
      else exp += item.amount;
    });
    setIncome(inc);
    setExpense(exp);
    setTotalBalance(inc - exp);
  };

  // --- AI ADVISOR LOGIC ---
  const handleAskAI = async () => {
    setIsAnalyzing(true);
    try {
      const topExpenses = transactions
        .filter((t) => t.type === "expense")
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: topExpenses,
          summary: { income, expense, balance: totalBalance },
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

  // --- FORMATTERS ---
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  // --- BUDGET LOGIC ---
  const saveBudget = () => {
    const value = Number(tempBudget.replace(/\D/g, ""));

    if (value > income) {
      showToast(`Budget melebihi Income (${formatCurrency(income)})`, "error");
      return;
    }

    setMonthlyBudget(value);
    localStorage.setItem("monthlyBudget", value.toString());
    setIsBudgetModalOpen(false);
    showToast("Budget updated!", "success");
  };

  const budgetPercentage =
    monthlyBudget > 0 ? Math.min((expense / monthlyBudget) * 100, 100) : 0;
  let progressColor = "bg-sky-700";
  if (budgetPercentage > 50) progressColor = "bg-yellow-500";
  if (budgetPercentage > 85) progressColor = "bg-red-500";

  const processedTransactions = transactions
    .filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return (
            new Date(b.date).getTime() - new Date(a.date).getTime() ||
            b.id - a.id
          );
        case "date-asc":
          return (
            new Date(a.date).getTime() - new Date(b.date).getTime() ||
            a.id - b.id
          );
        case "amount-high":
          return b.amount - a.amount;
        case "amount-low":
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

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
      fetchTransactions();
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
      fetchTransactions();
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
    <div className="bg-gray-100 min-h-screen flex justify-center">
      <div className="fixed inset-0 w-full max-w-md bg-slate-50 h-dvh flex flex-col overflow-hidden shadow-2xl overscroll-none mx-auto">
        {/* HEADER */}
        <header className="flex-none bg-sky-700 px-6 pt-8 pb-10 rounded-b-[2.5rem] text-white relative z-10 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sky-100 text-sm mb-1">Total Balance</p>
              <h1 className="text-3xl font-bold">
                {isLoading ? "..." : formatCurrency(totalBalance)}
              </h1>
            </div>

            {/* ACTION BUTTONS: BUDGET & AI */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAskAI}
                disabled={isAnalyzing}
                className="bg-white/20 p-2 rounded-full backdrop-blur-sm hover:bg-white/30 transition active:scale-95 disabled:opacity-50 relative group"
              >
                {isAnalyzing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Bot size={20} />
                )}
                {!isAnalyzing && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse border-2 border-sky-700"></span>
                )}
              </button>

              <button
                onClick={() => {
                  setTempBudget(monthlyBudget.toString());
                  setIsBudgetModalOpen(true);
                }}
                className="bg-white/20 p-2 rounded-full backdrop-blur-sm hover:bg-white/30 transition active:scale-95"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>

          <div className="bg-white text-gray-800 p-3 rounded-2xl shadow-lg flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 w-1/2 overflow-hidden">
              <div className="bg-green-100 p-1.5 rounded-full text-green-600 shrink-0">
                <ArrowUpCircle size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500">Income</p>
                <p className="font-bold text-xs sm:text-sm text-green-600 truncate">
                  {isLoading ? "..." : formatCurrency(income)}
                </p>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200 shrink-0"></div>
            <div className="flex items-center gap-2 w-1/2 pl-1 overflow-hidden">
              <div className="bg-red-100 p-1.5 rounded-full text-red-600 shrink-0">
                <ArrowDownCircle size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500">Expense</p>
                <p className="font-bold text-xs sm:text-sm text-red-600 truncate">
                  {isLoading ? "..." : formatCurrency(expense)}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 px-6 pt-6 pb-6 overflow-y-auto overscroll-y-auto scroll-smooth">
          {monthlyBudget > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-700">
                  Monthly Budget
                </span>
                <span className="text-xs font-medium text-gray-700">
                  {Math.round(budgetPercentage)}% used
                </span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all duration-500 ease-out`}
                  style={{ width: `${budgetPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                <span>Used: {formatCurrency(expense)}</span>
                <span>Limit: {formatCurrency(monthlyBudget)}</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search transaction..."
                className="w-full bg-white border border-gray-100 pl-10 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-100 shadow-sm placeholder:text-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              Recent Transactions
            </h2>
            <div className="relative">
              <ArrowUpDown
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-600 text-xs font-semibold pl-8 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-100 shadow-sm"
              >
                <option value="date-desc">Newest</option>{" "}
                <option value="date-asc">Oldest</option>{" "}
                <option value="amount-high">Highest</option>{" "}
                <option value="amount-low">Lowest</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-sky-700" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No transactions yet.
            </div>
          ) : processedTransactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No transaction found for "{searchQuery}".
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {processedTransactions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setDetailModal(item)}
                  className="relative flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition-all group active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0 pr-2">
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-full shrink-0 ${item.type === "income" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                    >
                      {item.type === "income" ? (
                        <ArrowUpCircle size={24} />
                      ) : (
                        <Wallet size={24} />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate leading-tight mb-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="truncate max-w-25 font-medium text-gray-500">
                          {item.category || "Others"}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0"></span>
                        <span className="whitespace-nowrap">
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p
                      className={`font-bold text-sm whitespace-nowrap ${item.type === "income" ? "text-green-600" : "text-gray-900"}`}
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
                        className="text-gray-300 hover:text-sky-700 hover:bg-sky-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ show: true, id: item.id });
                        }}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <nav className="flex-none bg-white border-t border-gray-100 py-3 px-15 flex justify-between items-center z-40 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
          <Link href="/" className="flex flex-col items-center text-sky-700">
            <Home size={24} />
            <span className="text-[10px] font-medium mt-1">Home</span>
          </Link>
          <div className="relative -top-8">
            <button
              onClick={() => {
                resetForm();
                setIsDrawerOpen(true);
              }}
              className="bg-sky-700 text-white h-14 w-14 rounded-full shadow-lg shadow-sky-700/40 flex items-center justify-center transform active:scale-95 transition-all hover:bg-sky-800"
            >
              <Plus size={32} />
            </button>
          </div>
          <Link
            href="/stats"
            className="flex flex-col items-center text-gray-400 hover:text-sky-700 transition-colors"
          >
            <PieChart size={24} />
            <span className="text-[10px] font-medium mt-1">Stats</span>
          </Link>
        </nav>

        {/* --- AI ADVISOR MODAL --- */}
        {isAiModalOpen && (
          <div
            className="absolute inset-0 z-90 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAiModalOpen(false)}
          >
            <div
              className="bg-white w-full max-w-sm rounded-3xl p-6 relative animate-in zoom-in-95 duration-300 shadow-2xl flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4 shrink-0">
                <div className="bg-linear-to-tr from-sky-700 to-purple-600 p-3 rounded-full text-white shadow-lg shadow-sky-700/30">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-none">
                    Financial Advisor
                  </h3>
                  <p className="text-xs text-sky-700 font-medium mt-1">
                    Powered by Gemini AI
                  </p>
                </div>
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="ml-auto bg-gray-50 hover:bg-gray-100 p-2 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* CONTENT */}
              <div className="overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-4 whitespace-pre-wrap pr-2 mb-4 custom-scrollbar">
                <ReactMarkdown
                  components={{
                    strong: ({ node, ...props }) => (
                      <span className="font-bold text-gray-900" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc ml-4 space-y-1" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal ml-4 space-y-1" {...props} />
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

              {/* FOOTER BUTTON */}
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 active:scale-[0.98] transition-all shrink-0 shadow-lg"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {/* --- BUDGET MODAL (UPDATED WITH LIMIT) --- */}
        {isBudgetModalOpen && (
          <div
            className="absolute inset-0 z-80 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsBudgetModalOpen(false)}
          >
            <div
              className="bg-white w-full max-w-xs p-6 rounded-2xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                Set Monthly Budget
              </h3>
              <input
                type="text"
                inputMode="numeric"
                className="w-full bg-gray-50 p-3 rounded-xl font-bold text-lg text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-sky-100 mb-2"
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

              {/* INFO BATAS MAKSIMAL */}
              <p className="text-xs text-gray-400 text-center mb-4">
                Maksimal:{" "}
                <span className="text-sky-700 font-bold">
                  {formatCurrency(income)}
                </span>
              </p>

              <button
                onClick={saveBudget}
                className="w-full bg-sky-700 text-white py-3 rounded-xl font-bold hover:bg-sky-800 transition active:scale-95"
              >
                Save Budget
              </button>
            </div>
          </div>
        )}

        {/* TOAST (UPDATED TO CENTER) */}
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
                  ? "bg-black text-white"
                  : "bg-red-500 text-white"
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
            <div className="bg-white w-full max-w-xs p-6 rounded-3xl shadow-2xl relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-200">
              <div
                className={`p-4 rounded-full mb-4 ${detailModal.type === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
              >
                {detailModal.type === "income" ? (
                  <ArrowUpCircle size={32} />
                ) : (
                  <Wallet size={32} />
                )}
              </div>
              <h3 className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                {detailModal.type === "income" ? "Income" : "Expense"}
              </h3>
              <h2
                className={`text-2xl font-bold mb-6 ${detailModal.type === "income" ? "text-green-600" : "text-red-600"}`}
              >
                {detailModal.type === "expense" && "- "}
                {formatCurrency(detailModal.amount)}
              </h2>
              <div className="w-full space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-start">
                  <span className="text-gray-400 text-xs font-medium">
                    Title
                  </span>
                  <span className="text-gray-800 text-sm font-bold text-right max-w-37.5 wrap-break-word">
                    {detailModal.title}
                  </span>
                </div>
                <div className="h-px bg-gray-200"></div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Tag size={14} />
                    <span className="text-xs font-medium">Category</span>
                  </div>
                  <span className="text-gray-800 text-sm font-semibold">
                    {detailModal.category || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Calendar size={14} />
                    <span className="text-xs font-medium">Date</span>
                  </div>
                  <span className="text-gray-800 text-sm font-semibold">
                    {formatFullDate(detailModal.date)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock size={14} />
                    <span className="text-xs font-medium">Time</span>
                  </div>
                  <span className="text-gray-800 text-sm font-semibold">
                    {formatTime(detailModal.date)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="mt-6 w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
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
            <div className="bg-white w-full max-w-xs p-6 rounded-2xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Delete Transaction?
                </h3>
                <div className="flex gap-3 w-full mt-4">
                  <button
                    onClick={() => setDeleteModal({ show: false, id: null })}
                    className="flex-1 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeDelete}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isDrawerOpen && (
          <div className="absolute inset-0 z-60 flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={resetForm}
            ></div>
            <div className="bg-white rounded-t-4xl p-5 relative z-10 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  {editingId ? "Edit Transaction" : "Add Transaction"}
                </h3>
                <button
                  onClick={resetForm}
                  className="bg-gray-100 p-2 rounded-full text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "expense" })
                    }
                    className={`py-2.5 rounded-xl font-medium text-sm transition-all ${formData.type === "expense" ? "bg-red-100 text-red-600 border-2 border-red-200" : "bg-gray-50 text-gray-400"}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "income" })}
                    className={`py-2.5 rounded-xl font-medium text-sm transition-all ${formData.type === "income" ? "bg-green-100 text-green-600 border-2 border-green-200" : "bg-gray-50 text-gray-400"}`}
                  >
                    Income
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Coffee"
                    className="w-full bg-gray-50 p-3 rounded-xl font-medium text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full bg-gray-50 p-3 rounded-xl font-bold text-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="date"
                      className="w-full bg-gray-50 p-3 pl-10 rounded-xl font-medium text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Category
                  </label>
                  <div className="relative">
                    <Tag
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full bg-gray-50 p-3 pl-10 rounded-xl font-medium text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
                      required
                    >
                      <option value="" disabled>
                        Select Category
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
                  className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold text-base mt-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
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
