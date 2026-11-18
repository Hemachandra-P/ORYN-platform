"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  ShieldCheck, Users, Home, ShoppingBag, CreditCard, AlertTriangle, 
  Settings, FileText, Activity, RefreshCw, Sparkles, DollarSign, 
  Download, Building, Layers, Sliders, CheckCircle2 
} from "lucide-react";
import { apiRequest, getStoredToken, getStoredUser } from "@/lib/api";

export default function AdminPanelPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<
    "overview" | "users" | "households" | "communities" | "moderation" | "subscriptions" | "financials" | "analytics" | "reports" | "logs"
  >("overview");

  // Admin Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [householdsList, setHouseholdsList] = useState<any[]>([]);
  const [communitiesList, setCommunitiesList] = useState<any[]>([]);
  const [moderationList, setModerationList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Subscription Configuration Form
  const [subConfig, setSubConfig] = useState({
    free_member_limit: 1,
    basic_plus_price_inr: 49,
    basic_plus_validity_months: 12,
    basic_plus_member_limit: 3,
    premium_price_inr: 99,
    premium_validity_months: 6,
    premium_member_capacity: 9999,
    marketplace_membership_price_inr: 20,
    marketplace_membership_validity_months: 6,
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // New community modal
  const [newCommName, setNewCommName] = useState("");
  const [newCommCity, setNewCommCity] = useState("Chennai");

  const [loading, setLoading] = useState(true);
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
        commsData,
        modData,
        repData,
        logsData,
        finData,
        analData,
        configData,
      ] = await Promise.all([
        apiRequest("/admin/overview"),
        apiRequest("/admin/users"),
        apiRequest("/admin/households"),
        apiRequest("/admin/communities"),
        apiRequest("/admin/marketplace/moderation"),
        apiRequest("/admin/reports"),
        apiRequest("/admin/audit-logs"),
        apiRequest("/admin/financials/report"),
        apiRequest("/admin/task-bill-analytics"),
        apiRequest("/admin/subscriptions/config"),
      ]);

      setMetrics(metricsData);
      setUsersList(usersData);
      setHouseholdsList(housesData);
      setCommunitiesList(commsData);
      setModerationList(modData);
      setReportsList(repData);
      setAuditLogs(logsData);
      setFinancials(finData);
      setAnalytics(analData);
      if (configData) setSubConfig(configData);
    } catch (err: any) {
      showToast(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await apiRequest("/admin/subscriptions/config", {
        method: "PUT",
        body: JSON.stringify(subConfig),
      });
      showToast("Subscription & pricing parameters updated!");
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to update configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim()) return;
    try {
      await apiRequest("/admin/communities", {
        method: "POST",
        body: JSON.stringify({ name: newCommName.trim(), city: newCommCity.trim() }),
      });
      setNewCommName("");
      showToast("Community added successfully!");
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to add community");
    }
  };

  const handleDeleteCommunity = async (commId: string) => {
    if (!confirm("Are you sure you want to delete this community?")) return;
    try {
      await apiRequest(`/admin/communities/${commId}`, { method: "DELETE" });
      showToast("Community removed.");
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete community");
    }
  };

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

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      await apiRequest(`/admin/users/${userId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`User status set to ${newStatus}`);
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: Activity },
    { id: "subscriptions", label: "Pricing & Membership Config", icon: Sliders },
    { id: "financials", label: "Separate Revenue Ledger", icon: DollarSign },
    { id: "communities", label: "Community Management", icon: Building },
    { id: "households", label: "Households & Flats", icon: Home },
    { id: "users", label: "User Accounts", icon: Users },
    { id: "moderation", label: "Listing Moderation", icon: ShoppingBag },
    { id: "analytics", label: "Task & Custom Bill Usage", icon: Layers },
    { id: "reports", label: "Reports & Complaints", icon: AlertTriangle },
    { id: "logs", label: "Admin Audit Trail", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-paper text-navy flex flex-col">
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
              <p className="text-xs text-mist mt-0.5">
                Authorized Admin: {currentUser?.full_name} ({currentUser?.role})
              </p>
            </div>
          </div>

          <button
            onClick={loadAllAdminData}
            className="px-3.5 py-2 rounded-xl bg-navy-secondary hover:bg-navy-secondary/80 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
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
                      : "text-navy-secondary hover:bg-paper hover:text-navy"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-coral" : "text-mist-dark"}`} />
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-[11px] text-mist-dark uppercase font-semibold">Total Users</p>
                  <p className="text-3xl font-black text-navy mt-1">{metrics.total_users}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    {metrics.active_users} Active · +{metrics.new_registrations_last_30d} 30d
                  </p>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-[11px] text-mist-dark uppercase font-semibold">Households & Flats</p>
                  <p className="text-3xl font-black text-navy mt-1">{metrics.total_households}</p>
                  <p className="text-[10px] text-mist-dark mt-1">
                    {metrics.free_households} Free · {metrics.premium_households} Premium
                  </p>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-[11px] text-mist-dark uppercase font-semibold">Mkt Memberships</p>
                  <p className="text-3xl font-black text-coral mt-1">
                    {metrics.active_marketplace_memberships}
                  </p>
                  <p className="text-[10px] text-mist-dark mt-1">
                    Active (₹20/6-mo) · {metrics.expired_marketplace_memberships} Expired
                  </p>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-[11px] text-mist-dark uppercase font-semibold">Marketplace Revenue</p>
                  <p className="text-3xl font-black text-emerald-600 mt-1">
                    ₹{(metrics.total_marketplace_membership_revenue_paise / 100).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-mist-dark mt-1">Separate from Subscriptions</p>
                </div>
              </div>

              {/* Status breakdown card */}
              <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5">
                <h3 className="font-bold text-sm text-navy mb-4">Platform Operational Health</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-paper-light border border-paper">
                    <p className="font-bold text-navy">Household Premium Subs Revenue</p>
                    <p className="text-2xl font-black text-navy mt-1">
                      ₹{(metrics.total_verified_subscription_revenue_paise / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-paper-light border border-paper">
                    <p className="font-bold text-navy">Pending Join Requests</p>
                    <p className="text-2xl font-black text-coral mt-1">{metrics.pending_join_requests}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-paper-light border border-paper">
                    <p className="font-bold text-navy">Flagged Listings</p>
                    <p className="text-2xl font-black text-navy mt-1">{metrics.reported_listings_count}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-paper-light border border-paper">
                    <p className="font-bold text-navy">Pending Complaints</p>
                    <p className="text-2xl font-black text-coral mt-1">{metrics.pending_complaints_count}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PRICING & MEMBERSHIP CONFIGURATION (Feature 2 & 10) */}
          {activeSection === "subscriptions" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-navy/5 space-y-6">
              <div>
                <h3 className="font-bold text-lg text-navy">Household & Marketplace Pricing Configuration</h3>
                <p className="text-xs text-navy-secondary mt-1">
                  Configure free plan member thresholds, premium household pricing, and ₹20 marketplace membership terms.
                </p>
              </div>

              <form onSubmit={handleSaveSubConfig} className="space-y-6">
                <div className="p-4 rounded-2xl bg-paper/40 border border-navy/10 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-navy">Household Plans Configuration</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-navy mb-1">Free Plan User Limit</label>
                      <input
                        type="number"
                        min="1"
                        max="1"
                        value={subConfig.free_member_limit}
                        onChange={(e) => setSubConfig({ ...subConfig, free_member_limit: parseInt(e.target.value || "1") })}
                        className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs text-navy font-bold bg-white"
                      />
                      <p className="text-[10px] text-mist-dark mt-1">1 individual user only</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy mb-1">Basic Plus Price (₹ INR)</label>
                      <input
                        type="number"
                        min="0"
                        value={subConfig.basic_plus_price_inr}
                        onChange={(e) => setSubConfig({ ...subConfig, basic_plus_price_inr: parseInt(e.target.value || "49") })}
                        className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs text-navy font-bold bg-white"
                      />
                      <p className="text-[10px] text-mist-dark mt-1">₹49 / year (3 members max)</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy mb-1">Premium Price (₹ INR)</label>
                      <input
                        type="number"
                        min="0"
                        value={subConfig.premium_price_inr}
                        onChange={(e) => setSubConfig({ ...subConfig, premium_price_inr: parseInt(e.target.value || "99") })}
                        className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs text-navy font-bold bg-white"
                      />
                      <p className="text-[10px] text-mist-dark mt-1">₹99 / 6 months (unlimited)</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-paper/40 border border-navy/10 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-navy">Marketplace Membership Policy</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-navy mb-1">Membership Price (₹ INR)</label>
                      <input
                        type="number"
                        min="0"
                        value={subConfig.marketplace_membership_price_inr}
                        onChange={(e) => setSubConfig({ ...subConfig, marketplace_membership_price_inr: parseInt(e.target.value || "20") })}
                        className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs text-navy font-bold bg-white"
                      />
                      <p className="text-[10px] text-mist-dark mt-1">Default is ₹20 for 6 months</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy mb-1">Membership Validity (Months)</label>
                      <input
                        type="number"
                        min="1"
                        value={subConfig.marketplace_membership_validity_months}
                        onChange={(e) => setSubConfig({ ...subConfig, marketplace_membership_validity_months: parseInt(e.target.value || "6") })}
                        className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs text-navy font-bold bg-white"
                      />
                      <p className="text-[10px] text-mist-dark mt-1">Six months validity</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="px-6 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all"
                  >
                    {savingConfig ? "Saving..." : "Save Pricing Parameters"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. SEPARATE REVENUE LEDGER (Feature 10) */}
          {activeSection === "financials" && financials && (
            <div className="space-y-6">
              {/* Export button */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-navy">Separate Platform Revenue Reports</h3>
                  <p className="text-xs text-navy-secondary">Strictly distinguishes Household vs Marketplace streams</p>
                </div>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(financials, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `oryn-financial-report-${Date.now()}.json`;
                    a.click();
                  }}
                  className="px-4 py-2 bg-navy hover:bg-navy-secondary text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export Financial Report
                </button>
              </div>

              {/* Household Revenue Card */}
              <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-navy">Household Premium Subscriptions (₹99 / 6-mo)</h4>
                  <span className="font-black text-sm text-navy">
                    Total: ₹{(financials.household_subscriptions.gross_revenue_paise / 100).toFixed(2)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-paper text-mist-dark uppercase font-bold">
                        <th className="pb-2">Order ID</th>
                        <th className="pb-2">Plan</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper">
                      {financials.household_subscriptions.transactions.map((tx: any) => (
                        <tr key={tx.id}>
                          <td className="py-2.5 font-mono text-[11px]">{tx.razorpay_order_id}</td>
                          <td className="py-2.5 uppercase font-bold text-coral">{tx.plan_id}</td>
                          <td className="py-2.5 font-bold">₹{(tx.amount_paise / 100).toFixed(2)}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Marketplace Membership Revenue Card */}
              <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-navy">Marketplace Memberships (₹20 / 6-mo)</h4>
                  <span className="font-black text-sm text-coral">
                    Total: ₹{(financials.marketplace_memberships.gross_revenue_paise / 100).toFixed(2)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-paper text-mist-dark uppercase font-bold">
                        <th className="pb-2">Order ID</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Validity End</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper">
                      {financials.marketplace_memberships.memberships.map((m: any) => (
                        <tr key={m.id}>
                          <td className="py-2.5 font-mono text-[11px]">{m.razorpay_order_id}</td>
                          <td className="py-2.5 font-bold">₹{(m.price_paise / 100).toFixed(2)}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {m.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-mist-dark">
                            {new Date(m.current_period_end).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. COMMUNITY MANAGEMENT (Feature 3 & 10) */}
          {activeSection === "communities" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base text-navy">Community & Township Management</h3>
                  <p className="text-xs text-navy-secondary">Manage predefined gated communities and residential societies</p>
                </div>
              </div>

              {/* Add Community Form */}
              <form onSubmit={handleAddCommunity} className="flex gap-3">
                <input
                  type="text"
                  required
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  placeholder="New community name (e.g. SRM Royal Palms)"
                  className="flex-1 px-4 py-2 rounded-xl border border-navy/15 text-xs text-navy"
                />
                <input
                  type="text"
                  value={newCommCity}
                  onChange={(e) => setNewCommCity(e.target.value)}
                  placeholder="City"
                  className="w-32 px-3 py-2 rounded-xl border border-navy/15 text-xs text-navy"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-coral text-white text-xs font-bold hover:bg-coral-hover"
                >
                  Add Community
                </button>
              </form>

              {/* Community List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {communitiesList.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-paper/40 border border-navy/10 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-navy">{c.name}</p>
                      <p className="text-[10px] text-mist-dark">{c.city} • Created {new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCommunity(c.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. HOUSEHOLDS MANAGEMENT */}
          {activeSection === "households" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">Registered Flats & Identity Hierarchy</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {householdsList.map((h) => (
                  <div key={h.id} className="p-4 rounded-2xl bg-paper-light border border-paper space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-navy">{h.full_identity || h.name}</h4>
                      <span className="font-mono px-2 py-0.5 rounded bg-white text-[10px] font-bold text-coral">
                        {h.invite_code}
                      </span>
                    </div>
                    <p className="text-xs text-mist-dark">
                      Community: {h.community_name || "SRM Area"} • Building: {h.building || "—"} • Flat: {h.flat_number || "—"}
                    </p>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-paper">
                      <span className="text-navy font-semibold">{h.members_count} Residents</span>
                      <span className="text-mist-dark">Owner: {h.owner?.full_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. USERS MANAGEMENT */}
          {activeSection === "users" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-navy">User Accounts</h3>
                <span className="text-xs text-mist-dark">{usersList.length} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-paper text-mist-dark uppercase font-bold">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper">
                    {usersList.map((u) => (
                      <tr key={u.id}>
                        <td className="py-2.5 font-bold text-navy">{u.full_name}</td>
                        <td className="py-2.5 text-mist-dark">{u.email}</td>
                        <td className="py-2.5 uppercase font-mono text-[10px]">{u.role}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
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

          {/* 7. MODERATION */}
          {activeSection === "moderation" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">Marketplace Listings Moderation</h3>
              <div className="divide-y divide-paper">
                {moderationList.map((m) => (
                  <div key={m.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-navy">{m.title}</h4>
                      <p className="text-xs text-mist-dark">
                        ₹{m.selling_price_paise / 100} • Status: <span className="font-bold uppercase text-coral">{m.status}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModerateListing(m.id, "approve")}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleModerateListing(m.id, "remove")}
                        className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-xl"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. TASK & CUSTOM BILL ANALYTICS (Feature 10) */}
          {activeSection === "analytics" && analytics && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
                <h3 className="font-bold text-base text-navy">Custom Bill Category Usage</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-paper/40 border border-navy/10">
                    <p className="text-mist-dark font-bold">Total Bills</p>
                    <p className="text-2xl font-black text-navy mt-1">{analytics.total_bills}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-paper/40 border border-navy/10">
                    <p className="text-mist-dark font-bold">Custom Category Bills</p>
                    <p className="text-2xl font-black text-coral mt-1">{analytics.custom_bill_count}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold text-navy mb-2">Custom Categories Created by Users:</p>
                  <div className="flex flex-wrap gap-2">
                    {analytics.custom_categories_used.length === 0 ? (
                      <span className="text-xs text-mist-dark">No custom categories used yet.</span>
                    ) : (
                      analytics.custom_categories_used.map((cat: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-paper font-bold text-xs text-coral">
                          {cat}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
                <h3 className="font-bold text-base text-navy">Chore & Task Assignment Delegation</h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-paper/40 border border-navy/10">
                    <p className="text-mist-dark font-bold">Total Tasks</p>
                    <p className="text-2xl font-black text-navy mt-1">{analytics.total_tasks}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-paper/40 border border-navy/10">
                    <p className="text-mist-dark font-bold">Pending Tasks</p>
                    <p className="text-2xl font-black text-amber-500 mt-1">{analytics.pending_tasks}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-paper/40 border border-navy/10">
                    <p className="text-mist-dark font-bold">Completed Tasks</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{analytics.completed_tasks}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 9. REPORTS */}
          {activeSection === "reports" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">User Reports & Complaints</h3>
              <div className="divide-y divide-paper text-xs">
                {reportsList.length === 0 ? (
                  <p className="py-6 text-center text-mist-dark">No outstanding reports.</p>
                ) : (
                  reportsList.map((r) => (
                    <div key={r.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-navy">{r.reason}</p>
                        <p className="text-mist-dark">{r.details}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-paper">
                        {r.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 10. AUDIT LOGS */}
          {activeSection === "logs" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">Administrative Security Audit Trail</h3>
              <div className="divide-y divide-paper text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex justify-between items-start">
                    <div>
                      <p className="font-bold font-mono text-coral text-[11px]">{log.action}</p>
                      <p className="text-navy-secondary mt-0.5">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-mist-dark">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
