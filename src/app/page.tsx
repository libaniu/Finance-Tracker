"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Home,
  PieChart,
  Plus,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  X,
  Trash2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// --- TYPES ---
interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  date: string;
}

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

export default function HomePage() {
  // --- MAIN STATE ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- UI STATE ---
  const [sortBy, setSortBy] = useState("date-desc");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: number | null }>({
    show: false,
    id: null,
  });
  
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense" as "income" | "expense",
  });

  // --- API & DATA FETCHING ---
  useEffect(() => {
    fetchTransactions();
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
      console.error("Error fetching data:", error);
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

  // --- SORTING LOGIC ---
  const sortedTransactions = [...transactions].sort((a, b) => {
    switch (sortBy) {
      case "date-desc": 
        return new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id;
      case "date-asc": 
        return new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id;
      case "amount-high": 
        return b.amount - a.amount;
      case "amount-low": 
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  // --- HANDLERS ---
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const rawValue = value.replace(/\D/g, "");
    setFormData({ ...formData, amount: rawValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("transactions").insert([
        {
          title: formData.title,
          amount: Number(formData.amount),
          type: formData.type,
          date: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setFormData({ title: "", amount: "", type: "expense" });
      setIsDrawerOpen(false);
      fetchTransactions();
      showToast("Transaction saved successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to save transaction.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: number) => setDeleteModal({ show: true, id });

  const executeDelete = async () => {
    const id = deleteModal.id;
    if (!id) return;

    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      fetchTransactions();
      showToast("Transaction deleted successfully.", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to delete transaction.", "error");
    } finally {
      setDeleteModal({ show: false, id: null });
    }
  };

  // --- FORMATTERS ---
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const displayAmount = formData.amount
    ? new Intl.NumberFormat("id-ID").format(Number(formData.amount))
    : "";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    // 1. OUTER BACKGROUND
    <div className="bg-gray-100 min-h-screen flex justify-center">

      {/* 2. APP CONTAINER */}
      <div className="w-full max-w-md bg-slate-50 h-[100dvh] flex flex-col relative overflow-hidden shadow-2xl">
        
        {/* HEADER */}
        <header className="flex-none bg-blue-600 px-6 pt-8 pb-10 rounded-b-[2.5rem] text-white relative z-10 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Balance</p>
              <h1 className="text-3xl font-bold">
                {isLoading ? "..." : formatCurrency(totalBalance)}
              </h1>
            </div>
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
              <Wallet size={24} />
            </div>
          </div>

          {/* SUMMARY CARD (FIXED LAYOUT) */}
          <div className="bg-white text-gray-800 p-3 rounded-2xl shadow-lg flex justify-between items-center gap-2">
            
            {/* Income Block */}
            <div className="flex items-center gap-2 w-1/2 overflow-hidden">
              <div className="bg-green-100 p-1.5 rounded-full text-green-600 flex-shrink-0">
                <ArrowUpCircle size={20} />
              </div>
              <div className="min-w-0"> {/* min-w-0 penting biar text bisa truncate/wrap */}
                <p className="text-[10px] text-gray-500">Income</p>
                <p className="font-bold text-xs sm:text-sm text-green-600 truncate">
                  {isLoading ? "..." : formatCurrency(income)}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200 flex-shrink-0"></div>

            {/* Expense Block */}
            <div className="flex items-center gap-2 w-1/2 pl-1 overflow-hidden">
              <div className="bg-red-100 p-1.5 rounded-full text-red-600 flex-shrink-0">
                <ArrowDownCircle size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500">Expense</p>
                {/* Gunakan text-xs agar muat di HP, dan truncate biar ga nabrak */}
                <p className="font-bold text-xs sm:text-sm text-red-600 truncate" title={formatCurrency(expense)}>
                  {isLoading ? "..." : formatCurrency(expense)}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 px-6 pt-6 pb-6 overflow-y-auto">
          
          {/* Filter */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Transactions</h2>
            <div className="relative">
              <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-600 text-xs font-semibold pl-8 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm"
              >
                <option value="date-desc">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="amount-high">Highest</option>
                <option value="amount-low">Lowest</option>
              </select>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-blue-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No transactions yet.
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {sortedTransactions.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 group transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      item.type === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}>
                      {item.type === "income" ? <ArrowUpCircle size={20} /> : <Wallet size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-gray-400">{formatDate(item.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className={`font-bold text-xs sm:text-sm ${
                      item.type === "income" ? "text-green-600" : "text-gray-800"
                    }`}>
                      {item.type === "expense" ? "-" : "+"} {formatCurrency(item.amount)}
                    </p>
                    <button
                      onClick={() => confirmDelete(item.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* NAVBAR */}
        <nav className="flex-none bg-white border-t border-gray-100 py-3 px-8 flex justify-between items-center z-40 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
          <Link href="/" className="flex flex-col items-center text-blue-600">
            <Home size={24} />
            <span className="text-[10px] font-medium mt-1">Home</span>
          </Link>

          <div className="relative -top-8">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="bg-blue-600 text-white h-14 w-14 rounded-full shadow-lg shadow-blue-600/40 flex items-center justify-center transform active:scale-95 transition-all hover:bg-blue-700"
            >
              <Plus size={32} />
            </button>
          </div>

          <Link href="/stats" className="flex flex-col items-center text-gray-400 hover:text-blue-600 transition-colors">
            <PieChart size={24} />
            <span className="text-[10px] font-medium mt-1">Stats</span>
          </Link>
        </nav>

        {/* --- OVERLAYS --- */}
        
        {/* Toast */}
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] transition-all duration-300 ${
          toast.show ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"
        }`}>
          <div className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-xl ${
            toast.type === "success" ? "bg-black text-white" : "bg-red-500 text-white"
          }`}>
            {toast.type === "success" ? <CheckCircle size={18} className="text-green-400" /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>

        {/* Modal Delete */}
        {deleteModal.show && (
          <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setDeleteModal({ show: false, id: null })}
            ></div>
            <div className="bg-white w-full max-w-xs p-6 rounded-2xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Transaction?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  This action cannot be undone. Are you sure?
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDeleteModal({ show: false, id: null })}
                    className="flex-1 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeDelete}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drawer Add */}
        {isDrawerOpen && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            ></div>
            <div className="bg-white rounded-t-4xl p-6 relative z-10 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Add Transaction</h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="bg-gray-100 p-2 rounded-full text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Transaction Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Coffee"
                    className="w-full bg-gray-50 p-4 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:font-normal"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount (IDR)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full bg-gray-50 p-4 rounded-xl font-bold text-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "expense" })}
                    className={`p-3 rounded-xl font-medium text-sm transition-all ${
                      formData.type === "expense" ? "bg-red-100 text-red-600 border-2 border-red-200" : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "income" })}
                    className={`p-3 rounded-xl font-medium text-sm transition-all ${
                      formData.type === "income" ? "bg-green-100 text-green-600 border-2 border-green-200" : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    Income
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Transaction"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}