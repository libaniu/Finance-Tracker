"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
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
  Tag,
  Calendar,
  Clock,
  Pencil,
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

// --- CATEGORIES ---
const EXPENSE_CATEGORIES = [
  "Food & Beverage",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health",
  "Others",
];
const INCOME_CATEGORIES = ["Salary", "Bonus", "Gift", "Investment", "Others"];

export default function HomePage() {
  // --- STATE ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- UI STATES ---
  const [sortBy, setSortBy] = useState("date-desc");
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

  // FORM STATE (Updated with Date)
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: "", // BARU: State tanggal
    type: "expense" as "income" | "expense",
  });

  // --- FETCH DATA ---
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

  const sortedTransactions = [...transactions].sort((a, b) => {
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

  // --- ACTIONS ---

  const handleEdit = (item: Transaction) => {
    setEditingId(item.id);
    // Konversi ISO string ke format YYYY-MM-DD untuk input date HTML
    const dateObj = new Date(item.date);
    const dateString = dateObj.toISOString().split("T")[0];

    setFormData({
      title: item.title,
      amount: item.amount.toString(),
      category: item.category,
      date: dateString, // Set tanggal lama
      type: item.type,
    });
    setIsDrawerOpen(true);
  };

  const resetForm = () => {
    // Default tanggal hari ini
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

    // Gabungkan Tanggal yang dipilih dengan Jam saat ini agar urutan tidak berantakan
    const now = new Date();
    const selectedDate = new Date(formData.date);
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const payload = {
      title: formData.title,
      amount: Number(formData.amount),
      type: formData.type,
      category: formData.category || "Others",
      date: selectedDate.toISOString(), // Gunakan tanggal inputan user
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
      console.error(error);
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

  // --- HELPERS ---
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
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
      {/* APP CONTAINER */}
      <div className="fixed inset-0 w-full max-w-md bg-slate-50 h-dvh flex flex-col relative overflow-hidden shadow-2xl overscroll-none mx-auto">
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
                className="appearance-none bg-white border border-gray-200 text-gray-600 text-xs font-semibold pl-8 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm"
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
              <Loader2 className="animate-spin text-blue-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No transactions yet.
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {sortedTransactions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setDetailModal(item)}
                  className="relative flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition-all group active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0 pr-2">
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-full shrink-0 ${
                        item.type === "income"
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
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
                      className={`font-bold text-sm whitespace-nowrap ${
                        item.type === "income"
                          ? "text-green-600"
                          : "text-gray-900"
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
                        className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
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

        {/* NAVBAR */}
        <nav className="flex-none bg-white border-t border-gray-100 py-3 px-12 flex justify-between items-center z-40 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
          <Link href="/" className="flex flex-col items-center text-blue-600">
            <Home size={24} />{" "}
            <span className="text-[10px] font-medium mt-1">Home</span>
          </Link>
          <div className="relative -top-8">
            <button
              onClick={() => {
                resetForm();
                setIsDrawerOpen(true);
              }}
              className="bg-blue-600 text-white h-14 w-14 rounded-full shadow-lg shadow-blue-600/40 flex items-center justify-center transform active:scale-95 transition-all hover:bg-blue-700"
            >
              <Plus size={32} />
            </button>
          </div>
          <Link
            href="/stats"
            className="flex flex-col items-center text-gray-400 hover:text-blue-600 transition-colors"
          >
            <PieChart size={24} />{" "}
            <span className="text-[10px] font-medium mt-1">Stats</span>
          </Link>
        </nav>

        {/* POPUP DETAIL */}
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

        {/* DELETE MODAL */}
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

        {/* TOAST */}
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-90 transition-all duration-300 ${toast.show ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
        >
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-xl ${toast.type === "success" ? "bg-black text-white" : "bg-red-500 text-white"}`}
          >
            {toast.type === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}{" "}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>

        {/* DRAWER FORM */}
        {isDrawerOpen && (
          <div className="absolute inset-0 z-60 flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={resetForm}
            ></div>
            <div className="bg-white rounded-t-4xl p-6 relative z-10 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingId ? "Edit Transaction" : "Add Transaction"}
                </h3>
                <button
                  onClick={resetForm}
                  className="bg-gray-100 p-2 rounded-full text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "expense" })
                    }
                    className={`p-3 rounded-xl font-medium text-sm transition-all ${formData.type === "expense" ? "bg-red-100 text-red-600 border-2 border-red-200" : "bg-gray-50 text-gray-400"}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "income" })}
                    className={`p-3 rounded-xl font-medium text-sm transition-all ${formData.type === "income" ? "bg-green-100 text-green-600 border-2 border-green-200" : "bg-gray-50 text-gray-400"}`}
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
                    className="w-full bg-gray-50 p-4 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                    className="w-full bg-gray-50 p-4 rounded-xl font-bold text-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    required
                  />
                </div>

                {/* --- DATE PICKER INPUT --- */}
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
                      className="w-full bg-gray-50 p-4 pl-10 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
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
                      className="w-full bg-gray-50 p-4 pl-10 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
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
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
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
