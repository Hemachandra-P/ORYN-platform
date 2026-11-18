"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  ShieldCheck, Users, Home, ShoppingBag, CreditCard, AlertTriangle, 
  Settings, FileText, Activity, CheckCircle, XCircle, Search, 
  ArrowUpRight, RefreshCw, Lock, Sparkles, Filter, DollarSign, 
  RotateCcw, Download, CheckCircle2, ChevronRight
} from "lucide-react";
import { apiRequest, getStoredToken, getStoredUser } from "@/lib/api";

export default function AdminPanelPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<
    "overview" | "users" | "households" | "moderation" | "transactions" | "marketplace_fees" | "reports" | "logs" | "settings"
  >("overview");

  // Admin Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [householdsList, setHouseholdsList] = useState<any[]>([]);
  const [moderationList, setModerationList] = useState<any[]>([]);
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any[]>([]);

  // Marketplace Fee State
  const [feeSettings, setFeeSettings] = useState<{
    marketplace_fee_enabled: boolean;
    marketplace_fee_amount_paise: number;
    marketplace_fee_policy: string;
  }>({
    marketplace_fee_enabled: true,
    marketplace_fee_amount_paise: 2000,
    marketplace_fee_policy: "combined_fee",
  });
  const [savingFeeSettings, setSavingFeeSettings] = useState(false);
  const [marketplaceTransactions, setMarketplaceTransactions] = useState<any[]>([]);
  const [feeReport, setFeeReport] = useState<any>(null);
  const [refundingTxId, setRefundingTxId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user) {
      router.push("/auth/login");
      return;
    }
    if (user.role !== "super_admin" && user.role !== "platform_admin") {
      alert("Access Denied: Administrative privileges required.");
      router.push("/households");
      return;
    }
    setCurrentUser(user);
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [
        metricsData,
        usersData,
        housesData,
        modData,
        txData,
        repData,
        logsData,
        settingsData,
        feeSettingsData,
        mktTxData,
        feeRepData,
      ] = await Promise.all([
        apiRequest("/admin/overview"),
        apiRequest("/admin/users"),
        apiRequest("/admin/households"),
        apiRequest("/admin/marketplace/moderation"),
        apiRequest("/admin/transactions"),
        apiRequest("/admin/reports"),
        apiRequest("/admin/audit-logs"),
        apiRequest("/admin/settings"),
        apiRequest("/admin/marketplace/fee-settings"),
        apiRequest("/admin/marketplace/transactions"),
        apiRequest("/admin/marketplace/fee-report"),
      ]);

      setMetrics(metricsData);
      setUsersList(usersData);
      setHouseholdsList(housesData);
      setModerationList(modData);
      setTransactionsList(txData);
      setReportsList(repData);
      setAuditLogs(logsData);
      setPlatformSettings(settingsData);
      setFeeSettings(feeSettingsData);
      setMarketplaceTransactions(mktTxData);
      setFeeReport(feeRepData);
    } catch (err: any) {
      showToast(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  // Save Marketplace Fee Settings
  const handleSaveFeeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFeeSettings(true);
    try {
      const updated = await apiRequest("/admin/marketplace/fee-settings", {
        method: "PUT",
        body: JSON.stringify(feeSettings),
      });
      setFeeSettings(updated);
      showToast("Marketplace fee policy updated successfully!");
      // reload audit logs
      const logs = await apiRequest("/admin/audit-logs");
      setAuditLogs(logs);
    } catch (err: any) {
      showToast(err.message || "Failed to update fee settings");
    } finally {
      setSavingFeeSettings(false);
    }
  };

  // Process Refund
  const handleProcessRefund = async () => {
    if (!selectedTxForRefund) return;
    try {
      await apiRequest(`/admin/marketplace/transactions/${selectedTxForRefund.id}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason: refundReason || "Customer refund request" }),
      });
      showToast("Transaction fee refunded and logged in audit trail.");
      setShowRefundModal(false);
      setSelectedTxForRefund(null);
      setRefundReason("");
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || "Refund failed");
    }
  };

  // User Actions
  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      await apiRequest(`/admin/users/${userId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`User status updated to ${newStatus}`);
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Moderation Actions
  const handleModerateListing = async (listingId: string, action: string) => {
    try {
      await apiRequest(`/admin/marketplace/moderation/${listingId}?action=${action}`, {
        method: "PUT",
      });
      showToast(`Listing ${action}ed successfully`);
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Report Resolution
  const handleResolveReport = async (reportId: string, resolutionStatus: string) => {
    try {
      await apiRequest(`/admin/reports/${reportId}/resolve`, {
        method: "PUT",
        body: JSON.stringify({
          status: resolutionStatus,
          resolution_notes: `Resolved by ${currentUser?.full_name}`,
        }),
      });
      showToast(`Report marked as ${resolutionStatus}`);
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: Activity },
    { id: "marketplace_fees", label: "Marketplace Fees & Policies", icon: DollarSign },
    { id: "users", label: "User Accounts", icon: Users },
    { id: "households", label: "Households", icon: Home },
    { id: "moderation", label: "Listing Moderation", icon: ShoppingBag },
    { id: "transactions", label: "Subscription Revenue", icon: CreditCard },
    { id: "reports", label: "Reports & Complaints", icon: AlertTriangle },
    { id: "logs", label: "Admin Audit Logs", icon: FileText },
    { id: "settings", label: "Platform Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <Navbar />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white px-5 py-3 rounded-2xl shadow-elevated border border-coral text-sm flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-coral" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ADMIN TOP BANNER */}
      <div className="bg-navy text-white px-4 sm:px-6 lg:px-8 py-6 border-b border-navy-secondary">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-coral flex items-center justify-center font-bold text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">Creator & Platform Admin Panel</h1>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">
                  LIVE SECURE SESSION
                </span>
              </div>
              <p className="text-xs text-mutedblue mt-0.5">
                Authorized Platform Administrator: {currentUser?.full_name} ({currentUser?.role})
              </p>
            </div>
          </div>

          <button
            onClick={loadAllAdminData}
            className="px-3.5 py-2 rounded-xl bg-navy-secondary hover:bg-navy-secondary/80 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Live Metrics
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* SIDEBAR NAVIGATION (3 cols) */}
        <div className="md:col-span-3 space-y-1">
          <div className="bg-white rounded-3xl p-3 shadow-card border border-navy/5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-navy text-white shadow-sm"
                      : "text-navy-secondary hover:bg-cream hover:text-navy"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-coral" : "text-mutedblue-dark"}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN ADMIN CONTENT (9 cols) */}
        <div className="md:col-span-9 space-y-6">
          {/* 1. OVERVIEW METRICS */}
          {activeSection === "overview" && metrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-[11px] text-mutedblue-dark uppercase font-semibold">Total Users</p>
                  <p className="text-2xl font-black text-navy mt-1">{metrics.total_users}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    +{metrics.new_registrations_last_30d} 30d
                  </p>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-[11px] text-mutedblue-dark uppercase font-semibold">Active Flats</p>
                  <p className="text-2xl font-black text-navy mt-1">{metrics.total_households}</p>
                  <p className="text-[10px] text-mutedblue-dark mt-1">Households</p>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-[11px] text-mutedblue-dark uppercase font-semibold">Active Listings</p>
                  <p className="text-2xl font-black text-coral mt-1">{metrics.active_listings ?? metrics.total_listings}</p>
                  <p className="text-[10px] text-mutedblue-dark mt-1">
                    {metrics.sold_listings ?? 0} Sold · {metrics.deleted_listings ?? 0} Deleted
                  </p>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-[11px] text-mutedblue-dark uppercase font-semibold">Mkt Completed</p>
                  <p className="text-2xl font-black text-navy mt-1">
                    {metrics.total_completed_marketplace_transactions ?? 0}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">Purchases</p>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-[11px] text-mutedblue-dark uppercase font-semibold">Mkt Fees (Net)</p>
                  <p className="text-2xl font-black text-coral mt-1">
                    ₹{((metrics.marketplace_fees_collected_paise ?? 0) / 100).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-mutedblue-dark mt-1">Transaction Fees</p>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-[11px] text-mutedblue-dark uppercase font-semibold">Sub Revenue</p>
                  <p className="text-2xl font-black text-navy mt-1">
                    ₹{(metrics.verified_subscription_revenue_paise / 100).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    {metrics.active_premium_subscribers} Subs
                  </p>
                </div>
              </div>

              {/* Status breakdown card */}
              <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5">
                <h3 className="font-bold text-sm text-navy mb-4">Platform Operational Health</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-cream-light border border-cream">
                    <p className="font-bold text-navy">Pending Reports / Disputes</p>
                    <p className="text-2xl font-black text-coral mt-1">{metrics.pending_complaints_count}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-cream-light border border-cream">
                    <p className="font-bold text-navy">Flagged Listings</p>
                    <p className="text-2xl font-black text-navy mt-1">{metrics.reported_listings_count}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-cream-light border border-cream">
                    <p className="font-bold text-navy">Pending Mkt Payments</p>
                    <p className="text-2xl font-black text-amber-500 mt-1">
                      {metrics.pending_marketplace_payments_count ?? 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-cream-light border border-cream">
                    <p className="font-bold text-navy">Failed Payment Webhooks</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.failed_payments_count}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. MARKETPLACE FEES & POLICIES MANAGEMENT */}
          {activeSection === "marketplace_fees" && (
            <div className="space-y-6">
              {/* CONFIGURATION CARD */}
              <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-navy">Marketplace Fee Configuration</h3>
                    <p className="text-xs text-navy-secondary">
                      Configure the transaction fee amount and collection policy across the platform.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-coral-light text-coral">
                    Configurable Policy
                  </span>
                </div>

                <form onSubmit={handleSaveFeeSettings} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Fee Enabled Switch */}
                    <div className="p-4 rounded-2xl bg-cream/40 border border-navy/10 flex flex-col justify-between">
                      <div>
                        <label className="block text-xs font-bold text-navy mb-1">Marketplace Fee</label>
                        <p className="text-[11px] text-mutedblue-dark">Enable or disable transaction fee collection.</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFeeSettings({ ...feeSettings, marketplace_fee_enabled: !feeSettings.marketplace_fee_enabled })}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            feeSettings.marketplace_fee_enabled ? "bg-emerald-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                              feeSettings.marketplace_fee_enabled ? "right-0.5" : "left-0.5"
                            }`}
                          />
                        </button>
                        <span className="text-xs font-bold text-navy">
                          {feeSettings.marketplace_fee_enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>

                    {/* Fee Amount (in Rupees) */}
                    <div className="p-4 rounded-2xl bg-cream/40 border border-navy/10">
                      <label className="block text-xs font-bold text-navy mb-1">Fee Amount (₹ INR)</label>
                      <p className="text-[11px] text-mutedblue-dark mb-2">Default is ₹20 (2,000 paise).</p>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-navy">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={feeSettings.marketplace_fee_amount_paise / 100}
                          onChange={(e) =>
                            setFeeSettings({
                              ...feeSettings,
                              marketplace_fee_amount_paise: Math.round(parseFloat(e.target.value || "0") * 100),
                            })
                          }
                          className="w-full pl-7 pr-3 py-2 rounded-xl border border-navy/15 text-xs font-bold text-navy bg-white focus:outline-none focus:border-coral"
                        />
                      </div>
                    </div>

                    {/* Fee Policy Selector */}
                    <div className="p-4 rounded-2xl bg-cream/40 border border-navy/10">
                      <label className="block text-xs font-bold text-navy mb-1">Fee Collection Policy</label>
                      <p className="text-[11px] text-mutedblue-dark mb-2">Who bears the fee?</p>
                      <select
                        value={feeSettings.marketplace_fee_policy}
                        onChange={(e) =>
                          setFeeSettings({
                            ...feeSettings,
                            marketplace_fee_policy: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs font-bold text-navy bg-white focus:outline-none focus:border-coral"
                      >
                        <option value="seller_fee">Seller Fee (Deducted from seller)</option>
                        <option value="buyer_fee">Buyer Fee (Charged to buyer)</option>
                        <option value="both_fee">Both (Split ₹20 each)</option>
                        <option value="combined_fee">Single Combined Fee (₹20 by buyer)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingFeeSettings}
                      className="px-6 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      {savingFeeSettings ? "Saving..." : "Save Policy Configuration"}
                    </button>
                  </div>
                </form>
              </div>

              {/* SEPARATE MARKETPLACE REVENUE REPORT */}
              {feeReport && (
                <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-navy">Marketplace Revenue Analytics</h3>
                      <p className="text-xs text-navy-secondary">
                        Strictly separated from annual subscription revenues.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(feeReport, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `nestsync-marketplace-fee-report-${Date.now()}.json`;
                        a.click();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-secondary transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Fee Report (JSON)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-cream-light border border-cream">
                      <p className="text-mutedblue-dark font-bold">Gross Marketplace Fees</p>
                      <p className="text-2xl font-black text-navy mt-1">
                        ₹{(feeReport.gross_marketplace_fees_collected_paise / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-cream-light border border-cream">
                      <p className="text-mutedblue-dark font-bold">Total Refunds Processed</p>
                      <p className="text-2xl font-black text-red-500 mt-1">
                        -₹{(feeReport.total_refunded_paise / 100).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-mutedblue-dark">{feeReport.refunded_transactions_count} refunds</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-cream-light border border-cream">
                      <p className="text-mutedblue-dark font-bold">Net Marketplace Revenue</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">
                        ₹{(feeReport.net_marketplace_revenue_paise / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-cream-light border border-cream">
                      <p className="text-mutedblue-dark font-bold">Completed / Pending Orders</p>
                      <p className="text-2xl font-black text-navy mt-1">
                        {feeReport.completed_transactions_count} / {feeReport.pending_transactions_count}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* MARKETPLACE TRANSACTIONS TABLE */}
              <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-navy">Marketplace Transactions & Fee Ledger</h3>
                  <span className="text-xs text-mutedblue-dark">{marketplaceTransactions.length} records</span>
                </div>

                {marketplaceTransactions.length === 0 ? (
                  <p className="text-xs text-mutedblue-dark py-8 text-center">No marketplace transactions yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-cream text-mutedblue-dark uppercase font-bold tracking-wider">
                          <th className="pb-3">Order ID</th>
                          <th className="pb-3">Item Price</th>
                          <th className="pb-3">Buyer Fee</th>
                          <th className="pb-3">Seller Fee</th>
                          <th className="pb-3">Total Fee</th>
                          <th className="pb-3">Policy</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream">
                        {marketplaceTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-cream/30">
                            <td className="py-3 font-mono text-[11px] font-bold text-navy">
                              {tx.razorpay_order_id}
                              {tx.is_simulation && (
                                <span className="ml-1 text-[9px] px-1 py-0.2 bg-blue-100 text-blue-700 rounded font-bold">
                                  SIM
                                </span>
                              )}
                            </td>
                            <td className="py-3 font-bold text-navy">₹{(tx.item_price_paise / 100).toFixed(2)}</td>
                            <td className="py-3 text-coral font-semibold">₹{(tx.buyer_fee_paise / 100).toFixed(2)}</td>
                            <td className="py-3 text-coral font-semibold">₹{(tx.seller_fee_paise / 100).toFixed(2)}</td>
                            <td className="py-3 font-bold text-navy">₹{(tx.total_fee_paise / 100).toFixed(2)}</td>
                            <td className="py-3 text-[11px] capitalize text-mutedblue-dark">
                              {tx.fee_policy_applied?.replace("_", " ")}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                                  tx.status === "completed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : tx.status === "refunded"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              {tx.status === "completed" && (
                                <button
                                  onClick={() => {
                                    setSelectedTxForRefund(tx);
                                    setShowRefundModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-bold text-[11px] border border-red-200 transition-colors"
                                >
                                  Refund Fee
                                </button>
                              )}
                              {tx.status === "refunded" && (
                                <span className="text-[10px] text-mutedblue-dark">
                                  Refunded: {tx.refund_reason || "Admin processed"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. USER MANAGEMENT */}
          {activeSection === "users" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-navy">Registered User Accounts</h3>
                <span className="text-xs text-mutedblue-dark">{usersList.length} total users</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-cream text-mutedblue-dark uppercase font-bold tracking-wider">
                      <th className="pb-3">User</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Tier</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-cream/30">
                        <td className="py-3 font-bold text-navy">{u.full_name}</td>
                        <td className="py-3 text-mutedblue-dark">{u.email}</td>
                        <td className="py-3">
                          <span className="font-mono px-2 py-0.5 rounded bg-cream text-[10px] uppercase font-bold">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 capitalize text-navy font-semibold">{u.subscription_tier}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                              u.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          {u.status === "active" ? (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, "suspended")}
                              className="text-red-500 font-bold hover:underline"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, "active")}
                              className="text-emerald-600 font-bold hover:underline"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. HOUSEHOLDS */}
          {activeSection === "households" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">Shared Flat & Household Registries</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {householdsList.map((h) => (
                  <div key={h.id} className="p-4 rounded-2xl bg-cream-light border border-cream space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-navy">{h.name}</h4>
                      <span className="font-mono px-2 py-0.5 rounded bg-white text-[10px] font-bold text-coral">
                        {h.invite_code}
                      </span>
                    </div>
                    <p className="text-xs text-mutedblue-dark">{h.address || "SRM Campus Area"}</p>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-cream">
                      <span className="text-navy font-semibold">{h.members_count} Residents</span>
                      <span className="text-mutedblue-dark">Admin: {h.creator?.full_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. MODERATION */}
          {activeSection === "moderation" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">Marketplace Listing Moderation</h3>
              <div className="divide-y divide-cream">
                {moderationList.map((m) => (
                  <div key={m.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-cream overflow-hidden">
                        {m.images && m.images[0] ? (
                          <img src={m.images[0].image_url} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-navy">{m.title}</h4>
                        <p className="text-xs text-mutedblue-dark">
                          ₹{m.selling_price_paise / 100} • Category: {m.category} • Status: <span className="font-bold uppercase text-coral">{m.status}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleModerateListing(m.id, "approve")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs hover:bg-emerald-200"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleModerateListing(m.id, "remove")}
                        className="px-3 py-1.5 rounded-xl bg-coral-light text-coral font-bold text-xs hover:bg-coral hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. VERIFIED SUBSCRIPTION TRANSACTIONS */}
          {activeSection === "transactions" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">Verified Annual Subscription Payment Ledger</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-cream text-mutedblue-dark uppercase font-bold tracking-wider">
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">Plan</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream">
                    {transactionsList.map((tx) => (
                      <tr key={tx.id} className="hover:bg-cream/30">
                        <td className="py-3 font-mono text-[11px] font-bold text-navy">{tx.razorpay_order_id}</td>
                        <td className="py-3 uppercase font-bold text-coral">{tx.plan_id}</td>
                        <td className="py-3 font-bold text-navy">₹{(tx.amount_paise / 100).toFixed(2)}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 text-mutedblue-dark text-[11px]">
                          {tx.is_simulation ? "Simulated Signature" : "HMAC-SHA256 Verified"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. REPORTS & DISPUTES */}
          {activeSection === "reports" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">User Reports & Complaints</h3>
              {reportsList.length === 0 ? (
                <p className="text-xs text-mutedblue-dark py-8 text-center">No outstanding reports.</p>
              ) : (
                <div className="divide-y divide-cream">
                  {reportsList.map((rep) => (
                    <div key={rep.id} className="py-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-coral/20 text-coral font-bold text-[10px] uppercase">
                            Target: {rep.target_type}
                          </span>
                          <span className="text-xs font-bold text-navy">{rep.reason}</span>
                        </div>
                        <p className="text-xs text-navy-secondary mt-1">{rep.details}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveReport(rep.id, "resolved")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id, "dismissed")}
                          className="px-3 py-1.5 rounded-xl bg-cream text-navy font-bold text-xs"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 8. AUDIT LOGS */}
          {activeSection === "logs" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">Administrative Security Audit Trail</h3>
              <div className="divide-y divide-cream text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between">
                    <div>
                      <p className="font-bold font-mono text-coral text-[11px]">{log.action}</p>
                      <p className="text-navy-secondary mt-0.5">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-mutedblue-dark shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. SETTINGS */}
          {activeSection === "settings" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">Platform Configuration Parameters</h3>
              <div className="space-y-3">
                {platformSettings.map((s) => (
                  <div key={s.key} className="p-4 rounded-2xl bg-cream-light border border-cream flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-bold text-navy">{s.key}</p>
                      <p className="text-[11px] text-mutedblue-dark">{s.description}</p>
                    </div>
                    <span className="font-bold text-xs bg-white px-3 py-1 rounded-xl border border-navy/10 text-coral">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REFUND MODAL */}
      {showRefundModal && selectedTxForRefund && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-elevated border border-navy/10">
            <h3 className="font-bold text-lg text-navy mb-2">Process Marketplace Fee Refund</h3>
            <p className="text-xs text-navy-secondary mb-4">
              Refund fee for Order <span className="font-mono font-bold text-navy">{selectedTxForRefund.razorpay_order_id}</span>. Total fee to refund: ₹{(selectedTxForRefund.total_fee_paise / 100).toFixed(2)}. This action is recorded in the administrative audit log.
            </p>
            <div className="space-y-3 mb-4">
              <label className="block text-xs font-bold text-navy">Refund Reason:</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Buyer dispute settled, order cancelled"
                className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs text-navy focus:outline-none focus:border-coral"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedTxForRefund(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefund}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
