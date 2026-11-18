"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  Receipt, ShoppingCart, CheckSquare, Sparkles, Plus, 
  Users, CreditCard, ArrowUpRight, ArrowDownLeft, Clock, 
  CheckCircle, AlertCircle, Send, Mic, Copy, UserCheck, Trash2
} from "lucide-react";
import { apiRequest, getStoredToken, getStoredUser } from "@/lib/api";

export default function HouseholdHubPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [households, setHouseholds] = useState<any[]>([]);
  const [activeHousehold, setActiveHousehold] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"expenses" | "bills" | "shopping" | "tasks" | "ai" | "members">("expenses");
  
  // Data states
  const [expenses, setExpenses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [shoppingItems, setShoppingItems] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  // Modals & form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showAddShoppingModal, setShowAddShoppingModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Form inputs
  const [newHouseName, setNewHouseName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("groceries");
  const [expenseSplitMethod, setExpenseSplitMethod] = useState("equal");
  
  // Settlement inputs
  const [settlePayeeId, setSettlePayeeId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleUpiRef, setSettleUpiRef] = useState("");

  // Bill inputs
  const [billTitle, setBillTitle] = useState("");
  const [billCategory, setBillCategory] = useState("electricity");
  const [billAmount, setBillAmount] = useState("");
  const [billDueDate, setBillDueDate] = useState("");
  const [billRecurrence, setBillRecurrence] = useState("monthly");

  // Shopping input
  const [shoppingTitle, setShoppingTitle] = useState("");
  const [shoppingQty, setShoppingQty] = useState("1");
  const [shoppingEstPrice, setShoppingEstPrice] = useState("");

  // Task input
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  // AI Assistant states
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPendingResult, setAiPendingResult] = useState<any>(null);

  // Notification / Toast
  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setCurrentUser(getStoredUser());
    loadHouseholds();
  }, []);

  const loadHouseholds = async () => {
    try {
      const data = await apiRequest("/households/");
      setHouseholds(data);
      if (data.length > 0) {
        selectHousehold(data[0]);
      }
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const selectHousehold = async (h: any) => {
    setActiveHousehold(h);
    loadHouseholdData(h.id);
  };

  const loadHouseholdData = async (hId: string) => {
    try {
      const [expData, balData, billData, shopData, taskData, actData] = await Promise.all([
        apiRequest(`/households/${hId}/expenses/`),
        apiRequest(`/households/${hId}/expenses/balances`),
        apiRequest(`/households/${hId}/bills/`),
        apiRequest(`/households/${hId}/shopping/`),
        apiRequest(`/households/${hId}/tasks/`),
        apiRequest(`/households/${hId}/activity`),
      ]);
      setExpenses(expData);
      setBalances(balData);
      setBills(billData);
      setShoppingItems(shopData);
      setTasks(taskData);
      setActivity(actData);
    } catch (err: any) {
      console.error("Error loading household data", err);
    }
  };

  // --- ACTIONS ---

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newH = await apiRequest("/households/", {
        method: "POST",
        body: JSON.stringify({ name: newHouseName }),
      });
      setShowCreateModal(false);
      setNewHouseName("");
      showToast(`Created household: ${newH.name}`);
      await loadHouseholds();
      selectHousehold(newH);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const joinedH = await apiRequest("/households/join", {
        method: "POST",
        body: JSON.stringify({ invitation_code: joinCode }),
      });
      setShowJoinModal(false);
      setJoinCode("");
      showToast(`Joined household: ${joinedH.name}`);
      await loadHouseholds();
      selectHousehold(joinedH);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold) return;
    try {
      const amountPaise = Math.round(parseFloat(expenseAmount) * 100);
      await apiRequest(`/households/${activeHousehold.id}/expenses/`, {
        method: "POST",
        body: JSON.stringify({
          title: expenseTitle,
          total_amount_paise: amountPaise,
          category: expenseCategory,
          split_method: expenseSplitMethod,
        }),
      });
      setShowAddExpenseModal(false);
      setExpenseTitle("");
      setExpenseAmount("");
      showToast("Expense logged successfully!");
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold) return;
    try {
      const amountPaise = Math.round(parseFloat(settleAmount) * 100);
      await apiRequest(`/households/${activeHousehold.id}/settlements/`, {
        method: "POST",
        body: JSON.stringify({
          payee_id: settlePayeeId,
          amount_paise: amountPaise,
          upi_reference: settleUpiRef || "UPI Payment",
        }),
      });
      setShowSettleModal(false);
      setSettleAmount("");
      setSettleUpiRef("");
      showToast("Settlement payment recorded! Pending confirmation from flatmate.");
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold) return;
    try {
      const amountPaise = Math.round(parseFloat(billAmount) * 100);
      await apiRequest(`/households/${activeHousehold.id}/bills/`, {
        method: "POST",
        body: JSON.stringify({
          title: billTitle,
          category: billCategory,
          amount_paise: amountPaise,
          due_date: new Date(billDueDate || Date.now()).toISOString(),
          recurrence: billRecurrence,
        }),
      });
      setShowAddBillModal(false);
      setBillTitle("");
      setBillAmount("");
      showToast("Bill added successfully!");
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const toggleBillPaid = async (billId: string, currentPaid: boolean) => {
    try {
      await apiRequest(`/households/${activeHousehold.id}/bills/${billId}`, {
        method: "PUT",
        body: JSON.stringify({ is_paid: !currentPaid }),
      });
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleAddShoppingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold) return;
    try {
      const estPrice = shoppingEstPrice ? Math.round(parseFloat(shoppingEstPrice) * 100) : null;
      await apiRequest(`/households/${activeHousehold.id}/shopping/`, {
        method: "POST",
        body: JSON.stringify({
          title: shoppingTitle,
          quantity: shoppingQty,
          estimated_price_paise: estPrice,
        }),
      });
      setShowAddShoppingModal(false);
      setShoppingTitle("");
      setShoppingEstPrice("");
      showToast("Added to shopping list!");
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const toggleShoppingPurchased = async (itemId: string, currentPurchased: boolean) => {
    try {
      await apiRequest(`/households/${activeHousehold.id}/shopping/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ is_purchased: !currentPurchased }),
      });
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold) return;
    try {
      await apiRequest(`/households/${activeHousehold.id}/tasks/`, {
        method: "POST",
        body: JSON.stringify({
          title: taskTitle,
          due_date: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        }),
      });
      setShowAddTaskModal(false);
      setTaskTitle("");
      showToast("Task assigned!");
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "todo" : "completed";
    try {
      await apiRequest(`/households/${activeHousehold.id}/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // AI Assistant handler
  const handleAiParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || !activeHousehold) return;
    setAiLoading(true);
    setAiPendingResult(null);

    try {
      const result = await apiRequest("/ai/parse", {
        method: "POST",
        body: JSON.stringify({
          household_id: activeHousehold.id,
          user_input: aiInput,
        }),
      });
      setAiPendingResult(result);
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiExecute = async () => {
    if (!aiPendingResult) return;
    setAiLoading(true);
    try {
      const res = await apiRequest("/ai/execute", {
        method: "POST",
        body: JSON.stringify({
          conversation_id: aiPendingResult.conversation_id,
          actions: aiPendingResult.actions,
        }),
      });
      showToast(res.message);
      setAiPendingResult(null);
      setAiInput("");
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <Navbar />

      {/* TOAST FEEDBACK */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white px-5 py-3 rounded-2xl shadow-elevated border border-coral text-sm flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-coral" />
          <span>{feedback}</span>
        </div>
      )}

      {/* TOP HEADER & HOUSEHOLD SELECTOR */}
      <div className="bg-navy text-white px-4 sm:px-6 lg:px-8 py-6 border-b border-navy-secondary">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-coral flex items-center justify-center font-bold text-xl text-white shadow-md">
              H
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">
                  {activeHousehold ? activeHousehold.name : "Household Management"}
                </h1>
                {activeHousehold && (
                  <span className="text-[10px] font-mono bg-navy-secondary px-2 py-0.5 rounded text-mutedblue border border-white/10 flex items-center gap-1">
                    CODE: {activeHousehold.invitation_code}
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(activeHousehold.invitation_code);
                        showToast("Invitation code copied!");
                      }} 
                      title="Copy invite code"
                      className="hover:text-coral"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-mutedblue mt-0.5">
                {activeHousehold?.address || "Active shared household & collaborative finances"}
              </p>
            </div>
          </div>

          {/* Household Switcher & Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {households.length > 1 && (
              <select
                value={activeHousehold?.id || ""}
                onChange={(e) => {
                  const selected = households.find((h) => h.id === e.target.value);
                  if (selected) selectHousehold(selected);
                }}
                className="bg-navy-secondary text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-coral"
              >
                {households.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowJoinModal(true)}
              className="px-3.5 py-2 rounded-xl bg-navy-secondary hover:bg-navy-secondary/80 text-xs font-semibold text-white border border-white/10 transition-colors"
            >
              Join Flat
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-coral hover:bg-coral-hover text-xs font-bold text-white shadow-md transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Flat
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="bg-white border-b border-cream-dark px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-6 overflow-x-auto py-3">
          {[
            { id: "expenses", label: "Shared Expenses", icon: Receipt },
            { id: "bills", label: "Recurring Bills", icon: Clock },
            { id: "shopping", label: "Shopping List", icon: ShoppingCart },
            { id: "tasks", label: "Chores & Tasks", icon: CheckSquare },
            { id: "ai", label: "AI Assistant", icon: Sparkles },
            { id: "members", label: "Flatmates", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-navy text-white shadow-sm"
                    : "text-navy-secondary hover:text-navy hover:bg-cream"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-coral" : "text-mutedblue-dark"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT AREA */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* EXPENSES TAB */}
        {activeTab === "expenses" && (
          <div className="space-y-8">
            {/* Balances Ledger Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-navy">Roommate Balances</h2>
                  <p className="text-xs text-navy-secondary">Real-time financial status & outstanding settlements</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettleModal(true)}
                    className="px-4 py-2 rounded-xl bg-white border border-navy/15 text-navy font-bold text-xs hover:bg-cream transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Settle Up
                  </button>
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="px-4 py-2 rounded-xl bg-coral hover:bg-coral-hover text-white font-bold text-xs shadow-md transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Expense
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {balances.map((b) => {
                  const isPositive = b.net_balance_paise > 0;
                  const isZero = b.net_balance_paise === 0;
                  return (
                    <div key={b.user_id} className="bg-white p-5 rounded-2xl shadow-card border border-navy/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center font-bold text-xs text-navy">
                          {b.user_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-navy">{b.user_name}</p>
                          <p className="text-[11px] text-mutedblue-dark">
                            Paid: ₹{(b.total_paid_paise / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-black text-sm ${
                          isZero ? "text-mutedblue-dark" : isPositive ? "text-emerald-600" : "text-coral"
                        }`}>
                          {isZero ? "Settled" : isPositive ? `+₹${(b.net_balance_paise / 100).toFixed(2)}` : `-₹${Math.abs(b.net_balance_paise / 100).toFixed(2)}`}
                        </p>
                        <p className="text-[10px] text-mutedblue-dark uppercase font-semibold">
                          {isZero ? "All Clear" : isPositive ? "Gets Back" : "Owes"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expenses History Table / List */}
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5">
              <h3 className="font-bold text-base text-navy mb-4">Household Expense History</h3>

              {expenses.length === 0 ? (
                <div className="text-center py-12 text-mutedblue-dark">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No expenses recorded yet.</p>
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="mt-3 px-4 py-2 bg-coral text-white text-xs font-bold rounded-xl"
                  >
                    Log First Expense
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-cream">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cream flex items-center justify-center text-navy shrink-0">
                          <Receipt className="w-5 h-5 text-coral" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-navy">{exp.title}</p>
                          <div className="flex items-center gap-2 text-xs text-mutedblue-dark mt-0.5">
                            <span className="capitalize font-medium px-2 py-0.5 bg-cream rounded text-[10px] text-navy">
                              {exp.category}
                            </span>
                            <span>Paid by {exp.paid_by?.full_name || "Member"}</span>
                            <span>•</span>
                            <span>{new Date(exp.expense_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:text-right w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between">
                        <span className="font-black text-base text-navy">
                          ₹{(exp.total_amount_paise / 100).toFixed(2)}
                        </span>
                        <span className="text-[11px] text-mutedblue-dark">
                          {exp.participants?.length || 0} shares ({exp.split_method} split)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BILLS TAB */}
        {activeTab === "bills" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Upcoming & Recurring Utility Bills</h2>
                <p className="text-xs text-navy-secondary">Electricity, WiFi, Maintenance, and Rent due date reminders</p>
              </div>
              <button
                onClick={() => setShowAddBillModal(true)}
                className="px-4 py-2 rounded-xl bg-coral hover:bg-coral-hover text-white font-bold text-xs shadow-md transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Bill
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bills.map((bill) => (
                <div key={bill.id} className="bg-white p-5 rounded-2xl shadow-card border border-navy/5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cream text-navy font-bold text-[10px] uppercase">
                        {bill.category}
                      </span>
                      {bill.recurrence !== "none" && (
                        <span className="text-[10px] text-mutedblue-dark capitalize">
                          ({bill.recurrence})
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-navy mt-1.5">{bill.title}</h3>
                    <p className="text-xs text-mutedblue-dark mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-coral" /> Due: {new Date(bill.due_date).toLocaleDateString()}
                    </p>
                    {bill.notes && (
                      <p className="text-xs text-navy-secondary mt-2 bg-cream/50 p-2 rounded-lg">{bill.notes}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-black text-lg text-navy">
                      ₹{(bill.amount_paise / 100).toFixed(2)}
                    </p>
                    <button
                      onClick={() => toggleBillPaid(bill.id, bill.is_paid)}
                      className={`mt-3 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        bill.is_paid
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                          : "bg-coral-light text-coral hover:bg-coral hover:text-white"
                      }`}
                    >
                      {bill.is_paid ? "Paid" : "Mark as Paid"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHOPPING LIST TAB */}
        {activeTab === "shopping" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Shared Household Shopping List</h2>
                <p className="text-xs text-navy-secondary">Real-time synchronized grocery & flat supplies checklist</p>
              </div>
              <button
                onClick={() => setShowAddShoppingModal(true)}
                className="px-4 py-2 rounded-xl bg-coral hover:bg-coral-hover text-white font-bold text-xs shadow-md transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5">
              <div className="divide-y divide-cream">
                {shoppingItems.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.is_purchased}
                        onChange={() => toggleShoppingPurchased(item.id, item.is_purchased)}
                        className="w-5 h-5 rounded text-coral focus:ring-coral cursor-pointer"
                      />
                      <div>
                        <p className={`text-sm font-semibold ${item.is_purchased ? "line-through text-mutedblue-dark" : "text-navy"}`}>
                          {item.title}
                        </p>
                        <p className="text-[11px] text-mutedblue-dark">
                          Qty: {item.quantity} {item.estimated_price_paise && `• Est: ₹${item.estimated_price_paise / 100}`}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      item.is_purchased ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {item.is_purchased ? "Purchased" : "Needed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHORES & TASKS TAB */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Household Chores & Responsibility Roster</h2>
                <p className="text-xs text-navy-secondary">Keep the flat clean with clear task assignments</p>
              </div>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="px-4 py-2 rounded-xl bg-coral hover:bg-coral-hover text-white font-bold text-xs shadow-md transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Assign Task
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="bg-white p-5 rounded-2xl shadow-card border border-navy/5 flex items-center justify-between">
                  <div>
                    <h3 className={`font-bold text-sm ${task.status === "completed" ? "line-through text-mutedblue-dark" : "text-navy"}`}>
                      {task.title}
                    </h3>
                    <p className="text-xs text-mutedblue-dark mt-1">
                      Assigned to: {task.assigned_to?.full_name || "Unassigned"}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      task.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-navy text-white hover:bg-navy-secondary"
                    }`}
                  >
                    {task.status === "completed" ? "Done" : "Mark Done"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI ASSISTANT TAB */}
        {activeTab === "ai" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-navy text-white p-6 sm:p-8 rounded-3xl shadow-elevated">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-coral flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">AI Household Assistant</h2>
                  <p className="text-xs text-mutedblue">Intelligent intent recognition for expenses, shopping, and chores</p>
                </div>
              </div>

              <form onSubmit={handleAiParse} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="e.g. Rahul paid ₹450 for milk, or We need cooking oil"
                    className="w-full bg-navy-secondary text-white placeholder-mutedblue px-4 py-3.5 pr-20 rounded-2xl border border-white/10 focus:outline-none focus:border-coral text-sm"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading}
                    className="absolute right-2 top-2 px-4 py-2 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold flex items-center gap-1 shadow-md transition-all"
                  >
                    {aiLoading ? "Thinking..." : <><Send className="w-3.5 h-3.5" /> Parse</>}
                  </button>
                </div>
              </form>

              {/* Action Confirmation Card */}
              {aiPendingResult && (
                <div className="mt-6 bg-navy-secondary/90 p-5 rounded-2xl border border-emerald-500/40 animate-fadeIn">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Proposed Action
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                      Intent: {aiPendingResult.intent}
                    </span>
                  </div>

                  <p className="text-sm text-cream mb-4">{aiPendingResult.summary}</p>

                  <div className="space-y-2 mb-4">
                    {aiPendingResult.actions?.map((act: any, idx: number) => (
                      <div key={idx} className="bg-navy p-3 rounded-xl border border-white/5 text-xs text-mutedblue flex items-center justify-between">
                        <span className="font-semibold text-white">{act.title || act.action_type}</span>
                        {act.total_amount_paise && (
                          <span className="font-bold text-coral">₹{(act.total_amount_paise / 100).toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleAiExecute}
                      disabled={aiLoading}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all"
                    >
                      Confirm & Execute Action
                    </button>
                    <button
                      onClick={() => setAiPendingResult(null)}
                      className="px-4 py-2.5 rounded-xl bg-navy text-mutedblue hover:text-white text-xs font-semibold"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FLATMATES TAB */}
        {activeTab === "members" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Household Members</h2>
                <p className="text-xs text-navy-secondary">All residents registered in this flat</p>
              </div>
              <div className="text-xs bg-white px-3 py-1.5 rounded-xl border border-navy/10 text-navy font-semibold">
                Invite Code: <span className="font-mono text-coral font-bold">{activeHousehold?.invitation_code}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5">
              <div className="divide-y divide-cream">
                {balances.map((m) => (
                  <div key={m.user_id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-coral/15 text-coral font-bold text-xs flex items-center justify-center">
                        {m.user_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-navy">{m.user_name}</p>
                        <p className="text-[11px] text-mutedblue-dark">Active Resident</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-cream rounded-full text-navy">
                      Member
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* ADD EXPENSE MODAL */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-xl text-navy mb-1">Add Shared Expense</h3>
            <p className="text-xs text-navy-secondary mb-6">Equal split calculated down to the exact paisa</p>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Weekly Supermarket Groceries"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1 uppercase tracking-wider">Amount (₹ INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="1200.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1 uppercase tracking-wider">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none capitalize"
                  >
                    <option value="groceries">Groceries</option>
                    <option value="utilities">Utilities & WiFi</option>
                    <option value="rent">Rent</option>
                    <option value="food_dining">Food & Dining</option>
                    <option value="household_items">Household Items</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1 uppercase tracking-wider">Split Method</label>
                  <select
                    value={expenseSplitMethod}
                    onChange={(e) => setExpenseSplitMethod(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none capitalize"
                  >
                    <option value="equal">Equal Split (All Members)</option>
                    <option value="custom">Custom Split</option>
                    <option value="percentage">Percentage Split</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-navy-secondary hover:text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE UP MODAL */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-xl text-navy mb-1">Record UPI Settlement</h3>
            <p className="text-xs text-navy-secondary mb-6">Log payment made to a flatmate for receipt confirmation</p>

            <form onSubmit={handleRecordSettlement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1 uppercase tracking-wider">Payee (Who did you pay?)</label>
                <select
                  required
                  value={settlePayeeId}
                  onChange={(e) => setSettlePayeeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
                >
                  <option value="">Select Flatmate</option>
                  {balances
                    .filter((b) => b.user_id !== currentUser?.id)
                    .map((b) => (
                      <option key={b.user_id} value={b.user_id}>{b.user_name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1 uppercase tracking-wider">Amount Paid (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="200.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1 uppercase tracking-wider">UPI Ref / App (Optional)</label>
                <input
                  type="text"
                  value={settleUpiRef}
                  onChange={(e) => setSettleUpiRef(e.target.value)}
                  placeholder="e.g. GPay / PhonePe reference 432190..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream mt-6">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-navy-secondary hover:text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE HOUSEHOLD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-lg text-navy mb-2">Create New Household</h3>
            <form onSubmit={handleCreateHousehold} className="space-y-4">
              <input
                type="text"
                required
                value={newHouseName}
                onChange={(e) => setNewHouseName(e.target.value)}
                placeholder="e.g. Skyline Heights Flat 402"
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-coral text-white text-xs font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN HOUSEHOLD MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-lg text-navy mb-2">Join with Invitation Code</h3>
            <form onSubmit={handleJoinHousehold} className="space-y-4">
              <input
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="e.g. SKYLINE402"
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none font-mono uppercase"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-coral text-white text-xs font-bold"
                >
                  Join Flat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD BILL MODAL */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-xl text-navy mb-4">Add Recurring / Due Bill</h3>
            <form onSubmit={handleAddBill} className="space-y-4">
              <input
                type="text"
                required
                value={billTitle}
                onChange={(e) => setBillTitle(e.target.value)}
                placeholder="e.g. TNEB Electricity Bill"
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="Amount ₹"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none font-bold"
                />
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none capitalize"
                >
                  <option value="electricity">Electricity</option>
                  <option value="internet">Internet / WiFi</option>
                  <option value="water">Water</option>
                  <option value="rent">Rent</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="gas">Gas Cylinder</option>
                </select>
              </div>
              <input
                type="date"
                required
                value={billDueDate}
                onChange={(e) => setBillDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
              />
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-coral text-white text-xs font-bold"
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SHOPPING MODAL */}
      {showAddShoppingModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-lg text-navy mb-3">Add to Shopping List</h3>
            <form onSubmit={handleAddShoppingItem} className="space-y-4">
              <input
                type="text"
                required
                value={shoppingTitle}
                onChange={(e) => setShoppingTitle(e.target.value)}
                placeholder="Item name (e.g. Cooking Oil)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={shoppingQty}
                  onChange={(e) => setShoppingQty(e.target.value)}
                  placeholder="Qty (e.g. 1L, 2pkts)"
                  className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs bg-cream/30"
                />
                <input
                  type="number"
                  value={shoppingEstPrice}
                  onChange={(e) => setShoppingEstPrice(e.target.value)}
                  placeholder="Est. ₹"
                  className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs bg-cream/30"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddShoppingModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-coral text-white text-xs font-bold"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-lg text-navy mb-3">Assign Chore / Task</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task title (e.g. Clean kitchen counter)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-coral text-white text-xs font-bold"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
