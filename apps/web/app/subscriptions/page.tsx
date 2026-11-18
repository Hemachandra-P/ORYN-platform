"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  CreditCard, CheckCircle2, ShieldCheck, Sparkles, RefreshCw, 
  ShoppingBag, Clock, AlertCircle, ArrowRight, Zap 
} from "lucide-react";
import { apiRequest, getStoredToken, getStoredUser } from "@/lib/api";

export default function SubscriptionsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [mySubData, setMySubData] = useState<any>(null);
  const [mktMembership, setMktMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, subData, mktData] = await Promise.all([
        apiRequest("/subscriptions/plans"),
        getStoredToken() ? apiRequest("/subscriptions/my-subscription") : Promise.resolve(null),
        getStoredToken() ? apiRequest("/subscriptions/marketplace-membership") : Promise.resolve(null),
      ]);
      setPlans(plansData);
      setMySubData(subData);
      setMktMembership(mktData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Checkout Household Plan (Free or ₹99 Premium)
  const handleHouseholdCheckout = async (planId: string) => {
    const token = getStoredToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setCheckingOut(planId);
    try {
      const orderRes = await apiRequest("/subscriptions/checkout", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId }),
      });

      if (planId === "free" || orderRes.amount_paise === 0) {
        showToast("Free Household Plan active!");
        await loadData();
        return;
      }

      // Simulate payment (Instant development test simulation)
      const simRes = await apiRequest(`/subscriptions/simulate-test-payment?order_id=${orderRes.order_id}`, {
        method: "POST",
      });

      // Verify payment signature
      const verifyRes = await apiRequest("/subscriptions/verify", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: orderRes.order_id,
          razorpay_payment_id: simRes.razorpay_payment_id,
          razorpay_signature: simRes.razorpay_signature,
          plan_id: planId,
        }),
      });

      showToast(verifyRes.message || "Premium Household Plan activated for 6 months!");
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Checkout failed");
    } finally {
      setCheckingOut(null);
    }
  };

  // Checkout Marketplace Membership (₹20 for 6 Months)
  const handleMarketplaceMembershipCheckout = async () => {
    const token = getStoredToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setCheckingOut("marketplace_membership");
    try {
      const orderRes = await apiRequest("/subscriptions/marketplace-membership/checkout", {
        method: "POST",
      });

      const simRes = await apiRequest(`/subscriptions/simulate-test-payment?order_id=${orderRes.order_id}`, {
        method: "POST",
      });

      const verifyRes = await apiRequest("/subscriptions/marketplace-membership/verify", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: orderRes.order_id,
          razorpay_payment_id: simRes.razorpay_payment_id,
          razorpay_signature: simRes.razorpay_signature,
        }),
      });

      showToast(verifyRes.message || "Marketplace Membership activated for six months!");
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Membership checkout failed");
    } finally {
      setCheckingOut(null);
    }
  };

  const hasActiveMkt = mktMembership?.membership?.has_active_membership;
  const isPremiumOwner = mySubData?.subscription_tier === "premium";

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <Navbar />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white px-5 py-3 rounded-2xl shadow-elevated border border-coral text-sm flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-coral" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-12">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-coral-light text-coral">
            Transparent Pricing
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
            Plans for Shared Living & Community Commerce
          </h1>
          <p className="text-sm text-navy-secondary">
            Household subscriptions are tied to the flat owner (flatmates join free). Marketplace membership is ₹20 for 6 months.
          </p>
        </div>

        {/* SECTION 1: MARKETPLACE MEMBERSHIP (₹20 FOR 6 MONTHS) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-navy/5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-coral/10 text-coral flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <h2 className="text-xl font-black text-navy">Marketplace Membership</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                  Fixed ₹20 / 6 Months
                </span>
              </div>

              <p className="text-xs text-navy-secondary leading-relaxed">
                Browsing the marketplace is always 100% free for everyone. To buy or publish listings, users purchase an active 6-month membership.
                One membership unlocks both unlimited buying and unlimited selling with <strong>zero per-listing charges</strong>.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-semibold text-navy">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Free product browsing
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited listings
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Direct buyer checkout
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 6 months validity
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Zero extra transaction fees
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Simple one-click renewal
                </div>
              </div>
            </div>

            <div className="md:col-span-4 bg-cream/40 rounded-2xl p-6 border border-navy/10 text-center space-y-4">
              <div>
                <p className="text-[11px] uppercase font-bold text-mutedblue-dark">Marketplace Access</p>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-black text-navy">₹20</span>
                  <span className="text-xs font-bold text-navy-secondary">/ 6 Months</span>
                </div>
              </div>

              {hasActiveMkt ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Active Membership
                  </div>
                  <p className="text-[10px] text-mutedblue-dark">
                    Valid until: {new Date(mktMembership.membership.expires_at).toLocaleDateString()}
                  </p>
                  <button
                    onClick={handleMarketplaceMembershipCheckout}
                    disabled={checkingOut === "marketplace_membership"}
                    className="w-full py-2 rounded-xl bg-navy hover:bg-navy-secondary text-white text-xs font-bold transition-all"
                  >
                    {checkingOut === "marketplace_membership" ? "Renewing..." : "Renew Membership (+6 Months)"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleMarketplaceMembershipCheckout}
                  disabled={checkingOut === "marketplace_membership"}
                  className="w-full py-3 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4" />
                  {checkingOut === "marketplace_membership" ? "Activating..." : "Get Membership for ₹20"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: HOUSEHOLD SUBSCRIPTION (FREE VS PREMIUM) */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-navy">Household Subscription Plans</h2>
            <p className="text-xs text-navy-secondary mt-1">
              The household owner’s subscription controls flatmate capacity. All flatmates join without paying individual fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* 1. FREE HOUSEHOLD PLAN */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-navy/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-lg text-navy">Free Household Plan</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-cream text-navy">
                    Default
                  </span>
                </div>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-3xl font-black text-navy">₹0</span>
                  <span className="text-xs font-bold text-mutedblue-dark">/ Free Forever</span>
                </div>
                <p className="text-xs text-navy-secondary mb-6">
                  Perfect for smaller flats. Up to <strong>3 members total</strong> (including the owner).
                </p>

                <div className="space-y-2.5 text-xs text-navy">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Max 3 household members total
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Equal expense splitting down to paise
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Recurring & custom bill categories
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Shared shopping lists
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Task assignment to flatmates
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-cream">
                <button
                  disabled={!isPremiumOwner}
                  className="w-full py-3 rounded-2xl bg-cream text-navy font-bold text-xs"
                >
                  {!isPremiumOwner ? "Current Default Plan" : "Downgrade to Free"}
                </button>
              </div>
            </div>

            {/* 2. PREMIUM HOUSEHOLD PLAN */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-elevated border-2 border-coral relative flex flex-col justify-between">
              <span className="absolute -top-3 right-6 bg-coral text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                Unlimited Flatmates
              </span>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-lg text-navy">Premium Household Plan</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-coral-light text-coral">
                    ₹99 / 6 Months
                  </span>
                </div>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-4xl font-black text-coral">₹99</span>
                  <span className="text-xs font-bold text-navy-secondary">/ 6 Months Validity</span>
                </div>
                <p className="text-xs text-navy-secondary mb-6">
                  Add unlimited flatmates for six months. Flatmates join and participate without paying individual subscriptions.
                </p>

                <div className="space-y-2.5 text-xs text-navy font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Unlimited household members for 6 months
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Only owner pays — flatmates join free
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> No automatic member removal if expired
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Unlimited custom bill categories & history
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Full task assignment & flatmate delegation
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-cream">
                <button
                  onClick={() => handleHouseholdCheckout("premium")}
                  disabled={checkingOut === "premium"}
                  className="w-full py-3 rounded-2xl bg-coral hover:bg-coral-hover text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {checkingOut === "premium" ? "Activating..." : isPremiumOwner ? "Renew Premium for ₹99" : "Upgrade to Premium (₹99)"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PAYMENT HISTORY & SECURITY NOTICE */}
        <div className="p-6 rounded-3xl bg-cream/40 border border-navy/10 flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-navy">Secure Payments & Test Mode</h4>
            <p className="text-navy-secondary leading-relaxed">
              All transactions are cryptographically verified server-side with HMAC-SHA256 signatures and idempotency protection.
              In local development mode, test transactions generate simulated credentials and activate subscriptions instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
