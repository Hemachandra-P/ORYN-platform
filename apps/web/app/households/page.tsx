"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt, ShoppingCart, CheckSquare, Plus, 
  Users, CreditCard, ArrowUpRight, ArrowDownLeft, Clock, 
  CheckCircle, AlertCircle, Send, Copy, UserCheck, Trash2, 
  Lock, Shield, ShieldCheck, Sparkles, Building, MapPin, 
  UserMinus, UserPlus, KeyRound, CheckCircle2, ChevronRight
} from "lucide-react";
import { apiRequest, getStoredToken, getStoredUser } from "@/lib/api";

export default function HouseholdHubPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [households, setHouseholds] = useState<any[]>([]);
  const [activeHousehold, setActiveHousehold] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"expenses" | "bills" | "shopping" | "tasks" | "members">("expenses");
  
  // Data states
  const [expenses, setExpenses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [shoppingItems, setShoppingItems] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [capacity, setCapacity] = useState<any>(null);
  const [invitations, setInvitations] = useState<any[]>([]);

  // Communities list for dropdown
  const [communities, setCommunities] = useState<any[]>([]);

  // Modals & form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showAddShoppingModal, setShowAddShoppingModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showDirectInviteModal, setShowDirectInviteModal] = useState(false);
  const [showPasswordSecurityModal, setShowPasswordSecurityModal] = useState(false);

  // Form inputs for Household Creation
  const [newHouseName, setNewHouseName] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState("Estancia");
  const [customCommunity, setCustomCommunity] = useState("");
  const [building, setBuilding] = useState("Tower A");
  const [flatNumber, setFlatNumber] = useState("Flat 404");
  const [city, setCity] = useState("Chennai");
  const [newJoiningPassword, setNewJoiningPassword] = useState("");
  const [enablePasswordJoin, setEnablePasswordJoin] = useState(false);

  // Join form inputs
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  // Direct invite inputs
  const [inviteEmail, setInviteEmail] = useState("");

  // Household Security Password modal
  const [managePassword, setManagePassword] = useState("");
  const [managePasswordEnabled, setManagePasswordEnabled] = useState(false);

  // Expense inputs
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("groceries");
  
  // Settlement inputs
  const [settlePayeeId, setSettlePayeeId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");

  // Bill inputs (Supports Custom Bill Category)
  const [billTitle, setBillTitle] = useState("");
  const [billCategory, setBillCategory] = useState("electricity");
  const [customBillCategory, setCustomBillCategory] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDueDate, setBillDueDate] = useState("");
  const [billRecurrence, setBillRecurrence] = useState("monthly");

  // Shopping input
  const [shoppingTitle, setShoppingTitle] = useState("");
  const [shoppingQty, setShoppingQty] = useState("1");
  const [shoppingEstPrice, setShoppingEstPrice] = useState("");

  // Task inputs (Supports Flatmate Assignment)
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  // Feedback Toast
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
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const data = await apiRequest("/households/communities");
      setCommunities(data);
    } catch (e) {
      console.error(e);
    }
  };

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
      const [expData, balData, billData, shopData, taskData, actData, capData, invData] = await Promise.all([
        apiRequest(`/households/${hId}/expenses/`),
        apiRequest(`/households/${hId}/expenses/balances`),
        apiRequest(`/households/${hId}/bills/`),
        apiRequest(`/households/${hId}/shopping/`),
        apiRequest(`/households/${hId}/tasks/`),
        apiRequest(`/households/${hId}/activity`),
        apiRequest(`/households/${hId}/capacity`),
        apiRequest(`/households/${hId}/invitations`),
      ]);
      setExpenses(expData);
      setBalances(balData);
      setBills(billData);
      setShoppingItems(shopData);
      setTasks(taskData);
      setActivity(actData);
      setCapacity(capData);
      setInvitations(invData);
    } catch (err: any) {
      console.error("Error loading household data", err);
    }
  };

  // --- ACTIONS ---

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const commName = selectedCommunity === "other" ? customCommunity.trim() : selectedCommunity;
      const created = await apiRequest("/households/", {
        method: "POST",
        body: JSON.stringify({
          name: newHouseName.trim() || `${commName} ${building} ${flatNumber}`,
          community_name: commName,
          building: building.trim(),
          flat_number: flatNumber.trim(),
          city: city.trim(),
          joining_password: enablePasswordJoin ? newJoiningPassword : null,
          password_joining_enabled: enablePasswordJoin,
        }),
      });

      setShowCreateModal(false);
      setNewHouseName("");
      showToast(`Created ${created.full_identity || created.name}!`);
      await loadHouseholds();
    } catch (err: any) {
      showToast(err.message || "Failed to create flat");
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest("/households/join", {
        method: "POST",
        body: JSON.stringify({
          invitation_code: joinCode.trim(),
          joining_password: joinPassword.trim() || null,
        }),
      });

      setShowJoinModal(false);
      setJoinCode("");
      setJoinPassword("");
      showToast("Join request submitted / Joined successfully!");
      await loadHouseholds();
    } catch (err: any) {
      showToast(err.message || "Failed to join household");
    }
  };

  const handleDirectInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold) return;
    try {
      const res = await apiRequest(`/households/${activeHousehold.id}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      setShowDirectInviteModal(false);
      setInviteEmail("");
      showToast(res.message);
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message || "Failed to send invitation");
    }
  };

  const handleApproveInvitation = async (invId: string) => {
    if (!activeHousehold) return;
    try {
      const res = await apiRequest(`/households/${activeHousehold.id}/invitations/${invId}/approve`, {
        method: "POST",
      });
      showToast(res.message);
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message || "Failed to approve request");
    }
  };

  const handleRejectInvitation = async (invId: string) => {
    if (!activeHousehold) return;
    try {
      const res = await apiRequest(`/households/${activeHousehold.id}/invitations/${invId}/reject`, {
        method: "POST",
      });
      showToast(res.message);
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message || "Failed to reject request");
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!activeHousehold) return;
    if (!confirm(`Are you sure you want to remove ${userName} from this flat? All historical expenses and settlements will remain safely preserved.`)) return;

    try {
      const res = await apiRequest(`/households/${activeHousehold.id}/members/${userId}`, {
        method: "DELETE",
      });
      showToast(res.message);
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message || "Failed to remove member");
    }
  };

  const handleSaveSecurityPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold) return;
    try {
      const res = await apiRequest(`/households/${activeHousehold.id}/security-password`, {
        method: "PUT",
        body: JSON.stringify({
          joining_password: managePassword,
          enabled: managePasswordEnabled,
        }),
      });
      showToast(res.message);
      setShowPasswordSecurityModal(false);
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message || "Failed to update security password");
    }
  };

  // Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold) return;
    try {
      const amountPaise = Math.round(parseFloat(expenseAmount) * 100);
      await apiRequest(`/households/${activeHousehold.id}/expenses/`, {
        method: "POST",
        body: JSON.stringify({
          title: expenseTitle,
          category: expenseCategory,
          total_amount_paise: amountPaise,
          split_type: "equal",
        }),
      });
      setShowAddExpenseModal(false);
      setExpenseTitle("");
      setExpenseAmount("");
      showToast("Expense logged with penny-accurate paise split!");
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Add Bill (With Custom Bill Category)
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
          custom_category: billCategory === "other" ? customBillCategory.trim() : null,
          amount_paise: amountPaise,
          due_date: new Date(billDueDate).toISOString(),
          recurrence: billRecurrence,
        }),
      });
      setShowAddBillModal(false);
      setBillTitle("");
      setCustomBillCategory("");
      setBillAmount("");
      setBillDueDate("");
      showToast("Bill recorded successfully!");
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

  // Add Shopping Item
  const handleAddShoppingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold) return;
    try {
      const estPrice = shoppingEstPrice ? Math.round(parseFloat(shoppingEstPrice) * 100) : null;
      await apiRequest(`/households/${activeHousehold.id}/shopping/`, {
        method: "POST",
        body: JSON.stringify({
          item_name: shoppingTitle,
          quantity: shoppingQty,
          estimated_price_paise: estPrice,
        }),
      });
      setShowAddShoppingModal(false);
      setShoppingTitle("");
      setShoppingEstPrice("");
      showToast("Item added to shared shopping list!");
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

  // Add Task (With Flatmate Assignment)
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold) return;
    try {
      await apiRequest(`/households/${activeHousehold.id}/tasks/`, {
        method: "POST",
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc.trim() || null,
          assigned_to_id: taskAssignedTo || null,
          due_date: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        }),
      });
      setShowAddTaskModal(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskAssignedTo("");
      setTaskDueDate("");
      showToast("Task assigned to flatmate!");
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await apiRequest(`/households/${activeHousehold.id}/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      loadHouseholdData(activeHousehold.id);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const isOwner = activeHousehold && currentUser && activeHousehold.owner_id === currentUser.id;

  return (
    <div className="min-h-screen bg-paper text-navy flex flex-col">
      <Navbar />

      <AnimatePresence>
        {feedback && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 right-6 z-50 bg-navy text-white pl-4 pr-5 py-3 rounded-xl shadow-elevated text-sm flex items-center gap-2.5 max-w-sm"
          >
            <span className="w-1.5 h-5 rounded-full bg-coral shrink-0" />
            <span>{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR / FLAT SWITCHER */}
      <div className="bg-white border-b border-navy/10 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-paper border border-navy/10 text-navy flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-extrabold text-navy">
                  {activeHousehold?.full_identity || activeHousehold?.name || "Household Hub"}
                </h1>
                {capacity?.is_premium ? (
                  <span className="px-2 py-0.5 rounded-full bg-coral-light text-coral text-[11px] font-bold uppercase">
                    Premium Flat (Unlimited)
                  </span>
                ) : capacity?.plan_id === "basic_plus" ? (
                  <span className="px-2 py-0.5 rounded-full bg-coral/10 text-coral text-[11px] font-bold uppercase">
                    Basic Plus ({capacity?.current_members_count || 1}/3 members)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-paper text-navy text-[11px] font-bold uppercase">
                    Household ({capacity?.current_members_count || 1}/{capacity?.max_allowed || 3} members)
                  </span>
                )}
              </div>
              <p className="text-xs text-navy-secondary">
                {activeHousehold?.community_name ? `${activeHousehold.community_name} · ` : ""}
                {activeHousehold?.city || "Chennai"} • Code: <span className="font-mono font-bold text-coral">{activeHousehold?.invitation_code}</span>
              </p>
            </div>
          </div>

          {/* ACTIONS: SWITCH, JOIN, CREATE */}
          <div className="flex items-center gap-2">
            {households.length > 1 && (
              <select
                value={activeHousehold?.id}
                onChange={(e) => {
                  const selected = households.find((h) => h.id === e.target.value);
                  if (selected) selectHousehold(selected);
                }}
                className="px-3 py-2 rounded-xl border border-navy/15 text-xs font-bold text-navy bg-paper/30 focus:outline-none"
              >
                {households.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.full_identity || h.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowJoinModal(true)}
              className="px-3.5 py-2 rounded-xl bg-paper hover:bg-navy/10 text-xs font-bold text-navy border border-navy/15 transition-all flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" /> Join Flat
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-coral hover:bg-coral-hover text-xs font-bold text-white  transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Flat
            </button>
          </div>
        </div>
      </div>

      {/* CAPACITY UPGRADE BANNER IF LIMIT REACHED */}
      {capacity && !capacity.can_add_member && (
        <div className="bg-sun-light border-b border-sun px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#8A6100] shrink-0" />
              <span className="font-bold text-navy">
                Your household has reached its maximum of {capacity.free_limit} members.
              </span>
              <span className="text-navy-secondary hidden sm:inline">
                Upgrade to Premium for ₹99 and add unlimited members for six months.
              </span>
            </div>
            {isOwner && (
              <Link
                href="/subscriptions"
                className="px-3 py-1 bg-coral text-white font-bold rounded-lg shadow-sm hover:bg-coral-hover text-xs"
              >
                Upgrade to Premium (₹99) &rarr;
              </Link>
            )}
          </div>
        </div>
      )}

      {/* NAVIGATION TABS */}
      {activeHousehold && (
        <div className="bg-white border-b border-navy/10 px-4 sm:px-6 lg:px-8 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
            {[
              { id: "expenses", label: "Shared Expenses", icon: Receipt },
              { id: "bills", label: "Recurring Bills", icon: Clock },
              { id: "shopping", label: "Shopping List", icon: ShoppingCart },
              { id: "tasks", label: "Chores & Tasks", icon: CheckSquare },
              { id: "members", label: "Manage Members", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap ${
                    isActive ? "text-navy" : "text-mist-dark hover:text-navy"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-coral" : ""}`} />
                  {tab.label}
                  {isActive && <motion.span layoutId="hh-tab" className="absolute left-3 right-3 bottom-0 h-0.5 bg-coral rounded-full" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* EMPTY / ONBOARDING UPGRADE STATE IF NO ACTIVE HOUSEHOLD */}
      {!activeHousehold && (
        <div className="max-w-3xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-card border border-navy/10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mx-auto">
            <Building className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-navy">Welcome to Household Hub</h2>
          <p className="text-xs sm:text-sm text-navy-secondary max-w-lg mx-auto leading-relaxed">
            Free Plan accounts can browse the community marketplace. To create a household, split bills, and manage tasks with flatmates, upgrade to <strong>Basic Plus (₹49/year)</strong> or <strong>Premium Household (₹99/6 months)</strong>.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/subscriptions"
              className="px-6 py-3 rounded-2xl bg-coral hover:bg-coral-hover text-white text-xs font-bold  transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> View Subscription Plans
            </Link>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-5 py-3 rounded-2xl bg-paper hover:bg-navy/10 text-navy text-xs font-bold border border-navy/15 transition-all flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" /> Join Flat with Code
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 rounded-2xl bg-navy hover:bg-navy-secondary text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create New Flat
            </button>
          </div>
        </div>
      )}

      {/* MAIN TAB CONTENT */}
      {activeHousehold && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* 1. SHARED EXPENSES TAB */}
        {activeTab === "expenses" && (
          <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Shared Ledger</h2>
                <p className="text-xs text-navy-secondary">Penny-accurate equal splitting down to exact paise</p>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="px-4 py-2 bg-coral hover:bg-coral-hover text-white text-xs font-bold rounded-xl  flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Log Expense
              </button>
            </div>

            {/* Balances overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {balances.map((b) => (
                <div key={b.user_id} className="bg-white p-5 rounded-2xl border border-navy/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-paper border border-navy/10 text-xs font-bold flex items-center justify-center">{(b.user_name || "?").charAt(0)}</span>
                    <p className="text-sm font-semibold text-navy">{b.user_name}</p>
                  </div>
                  <p className={`font-mono text-2xl font-semibold tabular mt-4 ${b.net_balance_paise >= 0 ? "text-mint" : "text-coral"}`}>
                    {b.net_balance_paise >= 0 ? `+₹${(b.net_balance_paise / 100).toFixed(2)}` : `-₹${Math.abs(b.net_balance_paise / 100).toFixed(2)}`}
                  </p>
                  <p className="text-xs text-mist-dark mt-1">{b.net_balance_paise >= 0 ? "Is owed" : "Owes"} · paid ₹{(b.total_paid_paise / 100).toFixed(2)} so far</p>
                </div>
              ))}
            </div>

            {/* Expense history table */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-navy/5">
              <h3 className="font-bold text-sm text-navy mb-4">Recent Expenses</h3>
              <div className="divide-y divide-paper text-xs">
                {expenses.length === 0 ? (
                  <p className="py-6 text-center text-mist-dark">No shared expenses logged yet.</p>
                ) : (
                  expenses.map((exp) => (
                    <div key={exp.id} className="py-3.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-navy">{exp.title}</p>
                        <p className="text-xs text-mist-dark capitalize">
                          {exp.category} • Paid by {exp.paid_by?.full_name || "Flatmate"} • {new Date(exp.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-mono font-semibold tabular text-sm text-navy">
                        ₹{(exp.total_amount_paise / 100).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. RECURRING BILLS TAB (Supports Custom Bill Category) */}
        {activeTab === "bills" && (
          <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Recurring & Due Bills</h2>
                <p className="text-xs text-navy-secondary">Standard & custom household bill categories</p>
              </div>
              <button
                onClick={() => setShowAddBillModal(true)}
                className="px-4 py-2 bg-coral hover:bg-coral-hover text-white text-xs font-bold rounded-xl  flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Bill
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card border border-navy/5">
              <div className="divide-y divide-paper text-xs">
                {bills.length === 0 ? (
                  <p className="py-6 text-center text-mist-dark">No bills added yet.</p>
                ) : (
                  bills.map((bill) => (
                    <div key={bill.id} className="py-3.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-bold text-[11px] uppercase bg-paper text-coral">
                            {bill.category === "other" && bill.custom_category ? bill.custom_category : bill.category}
                          </span>
                          <p className="font-bold text-navy">{bill.title}</p>
                        </div>
                        <p className="text-xs text-mist-dark mt-0.5">
                          Due: {new Date(bill.due_date).toLocaleDateString()} • {bill.recurrence}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm text-navy">
                          ₹{(bill.amount_paise / 100).toFixed(2)}
                        </span>
                        <button
                          onClick={() => toggleBillPaid(bill.id, bill.is_paid)}
                          className={`px-3 py-1 rounded-xl font-bold text-xs transition-colors ${
                            bill.is_paid ? "bg-mint-light text-mint" : "bg-paper text-navy hover:bg-navy/10"
                          }`}
                        >
                          {bill.is_paid ? "Paid" : "Mark as Paid"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. SHOPPING LIST TAB */}
        {activeTab === "shopping" && (
          <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Shared Shopping List</h2>
                <p className="text-xs text-navy-secondary">Items to buy for the flat</p>
              </div>
              <button
                onClick={() => setShowAddShoppingModal(true)}
                className="px-4 py-2 bg-coral hover:bg-coral-hover text-white text-xs font-bold rounded-xl  flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card border border-navy/5">
              <div className="divide-y divide-paper text-xs">
                {shoppingItems.length === 0 ? (
                  <p className="py-6 text-center text-mist-dark">Shopping list is currently empty.</p>
                ) : (
                  shoppingItems.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.is_purchased}
                          onChange={() => toggleShoppingPurchased(item.id, item.is_purchased)}
                          className="w-4 h-4 rounded text-coral"
                        />
                        <span className={`font-semibold ${item.is_purchased ? "line-through text-mist-dark" : "text-navy"}`}>
                          {item.item_name} ({item.quantity})
                        </span>
                      </div>
                      {item.estimated_price_paise && (
                        <span className="text-mist-dark">Est. ₹{item.estimated_price_paise / 100}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. CHORES & TASKS TAB (With Flatmate Assignment) */}
        {activeTab === "tasks" && (
          <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Flatmate Tasks & Chores</h2>
                <p className="text-xs text-navy-secondary">Assign responsibilities to specific flatmates</p>
              </div>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="px-4 py-2 bg-coral hover:bg-coral-hover text-white text-xs font-bold rounded-xl  flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Assign Task
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.length === 0 ? (
                <div className="col-span-full py-12 text-center text-mist-dark bg-white rounded-2xl p-6">
                  No tasks assigned yet. Click "Assign Task" to delegate chores to flatmates.
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-2xl p-5 shadow-card border border-navy/5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-sm text-navy">{task.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          task.status === "completed" ? "bg-mint-light text-mint" : "bg-sun-light text-[#8A6100]"
                        }`}>
                          {task.status}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-navy-secondary mb-3 leading-relaxed">{task.description}</p>
                      )}

                      {/* Assigned Flatmate Card */}
                      <div className="p-2.5 rounded-xl bg-paper/40 border border-navy/5 flex items-center gap-2.5 mt-2">
                        <div className="w-7 h-7 rounded-full bg-coral/20 text-coral font-bold text-xs flex items-center justify-center">
                          {task.assigned_to?.full_name?.slice(0, 2).toUpperCase() || "UN"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] uppercase font-bold text-mist-dark">Assigned To</p>
                          <p className="text-xs font-bold text-navy truncate">
                            {task.assigned_to?.full_name || "Unassigned"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-paper flex items-center justify-between text-xs">
                      <span className="text-mist-dark text-xs">
                        {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : "No due date"}
                      </span>
                      <button
                        onClick={() => toggleTaskStatus(task.id, task.status)}
                        className={`px-3 py-1 rounded-xl font-bold text-xs ${
                          task.status === "completed" ? "bg-mint-light text-mint" : "bg-navy text-white hover:bg-navy-secondary"
                        }`}
                      >
                        {task.status === "completed" ? "Completed ✓" : "Mark Done"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. MANAGE MEMBERS TAB (Feature 4 & Feature 5) */}
        {activeTab === "members" && (
          <div className="space-y-6 page-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-navy">Flatmate & Member Management</h2>
                <p className="text-xs text-navy-secondary">
                  Complete owner controls for invites, approval requests, joining password, and membership
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && (
                  <button
                    onClick={() => {
                      setManagePasswordEnabled(activeHousehold.password_joining_enabled || false);
                      setShowPasswordSecurityModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-paper hover:bg-navy/10 text-xs font-bold text-navy border border-navy/15 flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" /> Joining Password
                  </button>
                )}

                <button
                  onClick={() => setShowDirectInviteModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-coral hover:bg-coral-hover text-xs font-bold text-white  flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Invite by Email
                </button>
              </div>
            </div>

            {/* PENDING JOIN REQUESTS & INVITATIONS (Feature 4) */}
            {invitations.filter((i) => i.status === "pending").length > 0 && (
              <div className="bg-sun-light rounded-2xl p-6 border border-sun space-y-3">
                <h3 className="font-bold text-sm text-navy flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#8A6100]" /> Pending Join Requests & Invitations
                </h3>
                <div className="divide-y divide-sun/60 text-xs">
                  {invitations.filter((i) => i.status === "pending").map((inv) => (
                    <div key={inv.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-navy">
                          {inv.type === "join_request" ? (
                            `Join Request: ${inv.invitee?.full_name || inv.invitee_id}`
                          ) : (
                            `Invited: ${inv.email || inv.invitee?.full_name}`
                          )}
                        </p>
                        <p className="text-xs text-mist-dark">
                          Expires: {new Date(inv.expires_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveInvitation(inv.id)}
                          className="px-3 py-1.5 rounded-xl bg-mint hover:opacity-90 text-white font-bold text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectInvitation(inv.id)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-red-300 text-red-600 font-bold text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIVE FLATMATES LIST */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-navy/5">
              <h3 className="font-bold text-sm text-navy mb-4">Active Household Residents</h3>
              <div className="divide-y divide-paper text-xs">
                {balances.map((m) => {
                  const isThisOwner = activeHousehold?.owner_id === m.user_id;
                  return (
                    <div key={m.user_id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-navy text-white font-bold text-xs flex items-center justify-center">
                          {m.user_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-navy flex items-center gap-2">
                            {m.user_name}
                            {isThisOwner && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-coral-light text-coral">
                                Owner
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-mist-dark">
                            Active Member • Net Balance: ₹{(m.net_balance_paise / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Owner controls: remove/kick flatmate */}
                      {isOwner && !isThisOwner && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id, m.user_name)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-colors flex items-center gap-1"
                        >
                          <UserMinus className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* CREATE HOUSEHOLD MODAL (Feature 3 Community Hierarchy) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 sm:p-8 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-xl text-navy mb-1">Create Community Flat</h3>
            <p className="text-xs text-navy-secondary mb-4">
              Set community, building, and flat details to distinguish identical room numbers.
            </p>

            <form onSubmit={handleCreateHousehold} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                  Community Name *
                </label>
                <select
                  value={selectedCommunity}
                  onChange={(e) => setSelectedCommunity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs text-navy bg-white focus:outline-none focus:border-coral"
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="other">Other — Add Custom Community</option>
                </select>

                {selectedCommunity === "other" && (
                  <input
                    type="text"
                    required
                    value={customCommunity}
                    onChange={(e) => setCustomCommunity(e.target.value)}
                    placeholder="Enter custom community name"
                    className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:outline-none focus:border-coral"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                    Building / Tower *
                  </label>
                  <input
                    type="text"
                    required
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="e.g. Tower A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                    Flat / Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    placeholder="e.g. Flat 404"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:outline-none focus:border-coral font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:outline-none focus:border-coral"
                />
              </div>

              {/* Optional Joining Password (Feature 4) */}
              <div className="p-3.5 rounded-2xl bg-paper/50 border border-navy/10 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePasswordJoin}
                    onChange={(e) => setEnablePasswordJoin(e.target.checked)}
                    className="w-4 h-4 rounded text-coral"
                  />
                  <span className="text-xs font-bold text-navy">Enable Household Joining Password</span>
                </label>

                {enablePasswordJoin && (
                  <input
                    type="password"
                    value={newJoiningPassword}
                    onChange={(e) => setNewJoiningPassword(e.target.value)}
                    placeholder="Set secret flat password"
                    className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs text-navy bg-white focus:outline-none focus:border-coral"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold "
                >
                  Create Flat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN HOUSEHOLD MODAL (Feature 4 Method A) */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-lg text-navy mb-2">Join Flat with Code</h3>
            <form onSubmit={handleJoinHousehold} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Invitation Code *</label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. SYNC-A1B2C3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:border-coral focus:outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Joining Password (if required)</label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Enter flat password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:border-coral focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-coral text-white text-xs font-bold "
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIRECT INVITATION MODAL (Feature 4 Method B) */}
      {showDirectInviteModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-lg text-navy mb-2">Direct Flatmate Invitation</h3>
            <p className="text-xs text-navy-secondary mb-4">
              Send an official invite to a registered user's email address.
            </p>
            <form onSubmit={handleDirectInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Registered User Email *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. priya@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:border-coral focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDirectInviteModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-coral text-white text-xs font-bold "
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE SECURITY PASSWORD MODAL (Feature 5) */}
      {showPasswordSecurityModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-lg text-navy mb-2">Household Security Password</h3>
            <form onSubmit={handleSaveSecurityPassword} className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={managePasswordEnabled}
                  onChange={(e) => setManagePasswordEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-coral"
                />
                <span className="text-xs font-bold text-navy">Require password to join flat</span>
              </label>

              {managePasswordEnabled && (
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">New Joining Password</label>
                  <input
                    type="password"
                    required={managePasswordEnabled}
                    value={managePassword}
                    onChange={(e) => setManagePassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:border-coral focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordSecurityModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-coral text-white text-xs font-bold "
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 sm:p-8 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-xl text-navy mb-4">Log Shared Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <input
                type="text"
                required
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                placeholder="Title (e.g. Sunday Groceries at Reliance)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-paper/30 focus:border-coral focus:outline-none"
              />
              <input
                type="number"
                step="0.01"
                required
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="Amount ₹ (e.g. 1200)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-paper/30 focus:border-coral focus:outline-none font-bold"
              />
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-navy/15 text-sm bg-paper/30 focus:border-coral focus:outline-none"
              >
                <option value="groceries">Groceries</option>
                <option value="utilities">Utilities</option>
                <option value="food">Food Delivery</option>
                <option value="household_items">Household Items</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-coral text-white text-xs font-bold"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD BILL MODAL (Feature 8 Custom Bill Category) */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 sm:p-8 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-xl text-navy mb-4">Add Recurring / Due Bill</h3>
            <form onSubmit={handleAddBill} className="space-y-4">
              <input
                type="text"
                required
                value={billTitle}
                onChange={(e) => setBillTitle(e.target.value)}
                placeholder="e.g. TNEB Electricity Bill or Security"
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-paper/30 focus:border-coral focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="Amount ₹"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-paper/30 focus:border-coral focus:outline-none font-bold"
                />
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-navy/15 text-sm bg-paper/30 focus:border-coral focus:outline-none capitalize"
                >
                  <option value="electricity">Electricity</option>
                  <option value="internet">Internet / WiFi</option>
                  <option value="water">Water</option>
                  <option value="rent">Rent</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="gas">Gas Cylinder</option>
                  <option value="other">OTHER (CUSTOM BILL)</option>
                </select>
              </div>

              {/* CUSTOM BILL CATEGORY INPUT (Feature 8) */}
              {billCategory === "other" && (
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Enter Bill Category *</label>
                  <input
                    type="text"
                    required
                    value={customBillCategory}
                    onChange={(e) => setCustomBillCategory(e.target.value)}
                    placeholder="e.g. Maid Salary, Security Charges, Parking"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-white focus:border-coral focus:outline-none"
                  />
                </div>
              )}

              <input
                type="date"
                required
                value={billDueDate}
                onChange={(e) => setBillDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-paper/30 focus:border-coral focus:outline-none"
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
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-lg text-navy mb-3">Add to Shopping List</h3>
            <form onSubmit={handleAddShoppingItem} className="space-y-4">
              <input
                type="text"
                required
                value={shoppingTitle}
                onChange={(e) => setShoppingTitle(e.target.value)}
                placeholder="Item name (e.g. Cooking Oil)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-paper/30 focus:border-coral focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={shoppingQty}
                  onChange={(e) => setShoppingQty(e.target.value)}
                  placeholder="Qty"
                  className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs bg-paper/30"
                />
                <input
                  type="number"
                  value={shoppingEstPrice}
                  onChange={(e) => setShoppingEstPrice(e.target.value)}
                  placeholder="Est. ₹"
                  className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs bg-paper/30"
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

      {/* ASSIGN TASK MODAL (Feature 9 Flatmate Dropdown) */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 sm:p-8 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-xl text-navy mb-1">Assign Chore / Task</h3>
            <p className="text-xs text-navy-secondary mb-4">
              Delegate responsibilities directly to active flatmates.
            </p>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Clean kitchen counter and sink"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-paper/30 focus:border-coral focus:outline-none"
                />
              </div>

              {/* FLATMATE DROPDOWN (Feature 9) */}
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Assign to Flatmate *</label>
                <select
                  value={taskAssignedTo}
                  onChange={(e) => setTaskAssignedTo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs text-navy bg-white focus:outline-none focus:border-coral font-semibold"
                >
                  <option value="">-- Select Responsible Flatmate --</option>
                  {balances.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.user_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Task Description (Optional)</label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="e.g. Wipe with disinfectant after dinner"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs text-navy bg-paper/30 focus:border-coral focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs text-navy bg-paper/30 focus:border-coral focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold "
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
