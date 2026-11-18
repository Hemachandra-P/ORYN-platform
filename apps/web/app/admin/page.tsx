"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  ShieldCheck, Users, Home, ShoppingBag, CreditCard, AlertTriangle, 
  Settings, FileText, Activity, CheckCircle, XCircle, Search, 
  ArrowUpRight, RefreshCw, Lock, Sparkles, Filter 
} from "lucide-react";
import { apiRequest, getStoredToken, getStoredUser } from "@/lib/api";

export default function AdminPanelPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<
    "overview" | "users" | "households" | "moderation" | "transactions" | "reports" | "logs" | "settings"
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
      ] = await Promise.all([
        apiRequest("/admin/overview"),
        apiRequest("/admin/users"),
        apiRequest("/admin/households"),
        apiRequest("/admin/marketplace/moderation"),
        apiRequest("/admin/transactions"),
        apiRequest("/admin/reports"),
        apiRequest("/admin/audit-logs"),
        apiRequest("/admin/settings"),
      ]);

      setMetrics(metricsData);
      setUsersList(usersData);
      setHouseholdsList(housesData);
      setModerationList(modData);
      setTransactionsList(txData);
      setReportsList(repData);
      setAuditLogs(logsData);
      setPlatformSettings(settingsData);
    } catch (err: any) {
      showToast(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
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
    { id: "users", label: "User Accounts", icon: Users },
    { id: "households", label: "Households", icon: Home },
    { id: "moderation", label: "Listing Moderation", icon: ShoppingBag },
    { id: "transactions", label: "Verified Revenue", icon: CreditCard },
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-xs text-mutedblue-dark uppercase font-semibold">Total Users</p>
                  <p className="text-3xl font-black text-navy mt-1">{metrics.total_users}</p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">
                    +{metrics.new_registrations_last_30d} last 30 days
                  </p>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-xs text-mutedblue-dark uppercase font-semibold">Active Flats</p>
                  <p className="text-3xl font-black text-navy mt-1">{metrics.total_households}</p>
                  <p className="text-[11px] text-mutedblue-dark mt-1">Shared Households</p>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-xs text-mutedblue-dark uppercase font-semibold">Marketplace Items</p>
                  <p className="text-3xl font-black text-coral mt-1">{metrics.total_listings}</p>
                  <p className="text-[11px] text-mutedblue-dark mt-1">
                    {metrics.active_listings} Active · {metrics.sold_listings} Sold
                  </p>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-card border border-navy/5">
                  <p className="text-xs text-mutedblue-dark uppercase font-semibold">Verified Revenue</p>
                  <p className="text-3xl font-black text-navy mt-1">
                    ₹{(metrics.verified_subscription_revenue_paise / 100).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">
                    {metrics.active_premium_subscribers} Paid Subs
                  </p>
                </div>
              </div>

              {/* Status breakdown card */}
              <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5">
                <h3 className="font-bold text-sm text-navy mb-4">Platform Operational Health</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-cream-light border border-cream">
                    <p className="font-bold text-navy">Pending Reports / Disputes</p>
                    <p className="text-2xl font-black text-coral mt-1">{metrics.pending_complaints_count}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-cream-light border border-cream">
                    <p className="font-bold text-navy">Flagged Listings</p>
                    <p className="text-2xl font-black text-navy mt-1">{metrics.reported_listings_count}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-cream-light border border-cream">
                    <p className="font-bold text-navy">Failed Payment Webhooks</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.failed_payments_count}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. USER MANAGEMENT */}
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
                        <td className="py-3">
                          <span className="font-bold text-coral uppercase text-[10px]">
                            {u.subscription_tier}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-coral-light text-coral"
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          {u.status === "active" ? (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, "suspended")}
                              className="text-coral hover:underline font-bold text-[11px]"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, "active")}
                              className="text-emerald-600 hover:underline font-bold text-[11px]"
                            >
                              Reactivate
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

          {/* 3. HOUSEHOLDS MANAGEMENT */}
          {activeSection === "households" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">All Shared Households</h3>
              <div className="divide-y divide-cream">
                {householdsList.map((h) => (
                  <div key={h.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-navy">{h.name}</p>
                      <p className="text-xs text-mutedblue-dark">
                        City: {h.city} • Code: <span className="font-mono text-coral font-bold">{h.invitation_code}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full bg-cream text-xs font-bold text-navy">
                        {h.members_count} Resident(s)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. LISTING MODERATION */}
          {activeSection === "moderation" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">Marketplace Moderation Feed</h3>
              <div className="divide-y divide-cream">
                {moderationList.map((m) => (
                  <div key={m.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {m.images?.[0] ? (
                        <img src={m.images[0].image_url} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center text-xs text-mutedblue shrink-0">No Img</div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-navy">{m.title}</p>
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

          {/* 5. VERIFIED TRANSACTIONS */}
          {activeSection === "transactions" && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5 space-y-4">
              <h3 className="font-bold text-base text-navy">Verified Subscription Payment Ledger</h3>
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

          {/* 6. REPORTS & DISPUTES */}
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

          {/* 7. AUDIT LOGS */}
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

          {/* 8. SETTINGS */}
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
    </div>
  );
}
