"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  CreditCard, CheckCircle2, ShieldCheck, Sparkles, RefreshCw, 
  ShoppingBag, Clock, AlertCircle, ArrowRight, Zap, Users, Home, Check
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
      setPlans(plansData || []);
      setMySubData(subData);
      setMktMembership(mktData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Checkout Household Plan (Free, Basic Plus ₹49, or Premium ₹99)
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
        showToast("Free Plan is your default active plan!");
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

      showToast(verifyRes.message || `Activated ${planId.toUpperCase()} subscription!`);
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

  // Status computation
  const activeHouseholdPlanId = mySubData?.subscription?.plan_id || (mySubData?.subscription_tier === "premium" ? "premium" : mySubData?.subscription_tier === "basic_plus" ? "basic_plus" : "free");
  const householdSubEndDate = mySubData?.subscription?.current_period_end ? new Date(mySubData.subscription.current_period_end) : null;
  const isHouseholdActive = householdSubEndDate ? householdSubEndDate > new Date() : false;

  const currentHouseholdTier = (activeHouseholdPlanId === "premium" && isHouseholdActive)
    ? "premium"
    : (activeHouseholdPlanId === "basic_plus" && isHouseholdActive)
    ? "basic_plus"
    : "free";

  const hasActiveMkt = mktMembership?.membership?.has_active_membership;
  const mktExpiresAt = mktMembership?.membership?.expires_at ? new Date(mktMembership.membership.expires_at) : null;

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
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-coral-light text-coral">
            Transparent Pricing
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-navy tracking-tight">
            Plans for Shared Living &amp; Community Commerce
          </h1>
          <p className="text-sm text-navy-secondary max-w-2xl mx-auto">
            Choose a household plan to collaborate on expenses, bills, and chores. Marketplace Membership is completely independent, unlocking buying and selling for 6 months.
          </p>
        </div>

        {/* CURRENT SUBSCRIPTION STATUS BAR (For Logged In Users) */}
        {currentUser && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-navy/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6 text-coral" />
              </div>
              <div>
                <p className="text-xs text-mutedblue-dark font-medium">Logged in as {currentUser.full_name} ({currentUser.email})</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-navy">
                    Household Status:
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                    currentHouseholdTier === "premium" 
                      ? "bg-coral text-white" 
                      : currentHouseholdTier === "basic_plus" 
                      ? "bg-coral-light text-coral" 
                      : "bg-cream text-navy"
                  }`}>
                    {currentHouseholdTier === "premium" ? "Premium Household — Active" : currentHouseholdTier === "basic_plus" ? "Basic Plus — Active" : "Free Plan — Active"}
                  </span>
                  {householdSubEndDate && currentHouseholdTier !== "free" && (
                    <span className="text-[11px] text-mutedblue-dark">
                      (Valid until {householdSubEndDate.toLocaleDateString()})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-cream">
              <div className="text-right">
                <span className="text-xs font-bold text-navy">
                  Marketplace Status:
                </span>{" "}
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                  hasActiveMkt ? "bg-emerald-100 text-emerald-800" : "bg-cream text-mutedblue-dark"
                }`}>
                  {hasActiveMkt ? `Active until ${mktExpiresAt ? mktExpiresAt.toLocaleDateString() : "6 Months"}` : "Free Browsing Only"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: HOUSEHOLD PLANS */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/5 text-navy font-bold text-xs uppercase tracking-wider mb-2">
              <Home className="w-3.5 h-3.5 text-coral" />
              Household Management Plans
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy">Manage Your Flat, PG or Shared Home</h2>
            <p className="text-xs text-navy-secondary mt-1">
              Household subscriptions are tied to the household owner. Flatmates join without paying individual subscriptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* PLAN 1: FREE PLAN */}
            <div className={`bg-white rounded-3xl p-7 shadow-card border flex flex-col justify-between transition-all ${
              currentHouseholdTier === "free" ? "border-navy/20 ring-2 ring-navy/10" : "border-navy/5"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cream text-navy">
                    1 User
                  </span>
                  {currentHouseholdTier === "free" && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Current Plan
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-xl text-navy">Free Plan</h3>
                <p className="text-xs text-mutedblue-dark mt-1">One individual user only</p>

                <div className="my-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-navy">₹0</span>
                    <span className="text-xs font-bold text-mutedblue-dark">/ Free Forever</span>
                  </div>
                  <p className="text-[11px] text-mutedblue-dark mt-1 font-medium">No credit card required</p>
                </div>

                <div className="space-y-3 text-xs text-navy">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-mutedblue-dark">Features Included:</div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Create an individual account</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Log in and access website &amp; mobile application</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Browse community marketplace</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>View publicly available product listings &amp; details</span>
                  </div>

                  <div className="pt-3 border-t border-cream space-y-1.5 text-[11px] text-mutedblue-dark">
                    <p className="font-bold text-navy">Household Restrictions:</p>
                    <p className="flex items-center gap-1.5 text-navy-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-coral"></span> Cannot create or join a household
                    </p>
                    <p className="flex items-center gap-1.5 text-navy-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-coral"></span> Cannot split expenses or manage bills
                    </p>
                    <p className="flex items-center gap-1.5 text-navy-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-coral"></span> Cannot create shared lists or chores
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-cream">
                <button
                  disabled
                  className="w-full py-3 rounded-2xl bg-cream text-navy font-bold text-xs cursor-default"
                >
                  {currentHouseholdTier === "free" ? "Current Free Plan" : "Get Started Free"}
                </button>
              </div>
            </div>

            {/* PLAN 2: BASIC PLUS */}
            <div className={`bg-white rounded-3xl p-7 shadow-elevated border-2 border-coral relative flex flex-col justify-between transition-all ${
              currentHouseholdTier === "basic_plus" ? "ring-4 ring-coral/20" : ""
            }`}>
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-coral text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                Most Popular
              </span>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-coral-light text-coral">
                    Up to 3 Members
                  </span>
                  {currentHouseholdTier === "basic_plus" && (
                    <span className="text-[10px] font-bold text-coral bg-coral-light px-2 py-0.5 rounded-full border border-coral/30">
                      Active Plan
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-xl text-navy">Basic Plus</h3>
                <p className="text-xs text-mutedblue-dark mt-1">Up to 3 total household members, including owner</p>

                <div className="my-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-coral">₹49</span>
                    <span className="text-xs font-bold text-navy-secondary">/ 1 Year (12 Months)</span>
                  </div>
                  <p className="text-[11px] text-mutedblue-dark mt-1 font-medium">Just ₹4.08 per month</p>
                </div>

                <div className="space-y-3 text-xs text-navy font-medium">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-mutedblue-dark">Everything you need:</div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                    <span>Create one household &amp; add up to 2 additional members (3 total)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                    <span>Shared household expense tracking down to paise</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                    <span>Equal, custom and percentage expense splitting</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                    <span>Recurring and custom bill management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                    <span>Shared shopping lists</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                    <span>Household task assignment &amp; flatmate delegation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                    <span>Household activity history &amp; monthly spending reports</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-cream">
                <button
                  onClick={() => handleHouseholdCheckout("basic_plus")}
                  disabled={checkingOut === "basic_plus"}
                  className="w-full py-3.5 rounded-2xl bg-coral hover:bg-coral-hover text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {checkingOut === "basic_plus" 
                    ? "Activating..." 
                    : currentHouseholdTier === "basic_plus" 
                    ? "Renew Basic Plus (₹49)" 
                    : "Upgrade to Basic Plus"}
                </button>
              </div>
            </div>

            {/* PLAN 3: PREMIUM HOUSEHOLD */}
            <div className={`bg-white rounded-3xl p-7 shadow-card border flex flex-col justify-between transition-all ${
              currentHouseholdTier === "premium" ? "border-navy ring-4 ring-navy/10" : "border-navy/5"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Unlimited Members
                  </span>
                  {currentHouseholdTier === "premium" && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                      Active Plan
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-xl text-navy">Premium Household</h3>
                <p className="text-xs text-mutedblue-dark mt-1">Unlimited household members</p>

                <div className="my-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-navy">₹99</span>
                    <span className="text-xs font-bold text-navy-secondary">/ 6 Months</span>
                  </div>
                  <p className="text-[11px] text-mutedblue-dark mt-1 font-medium">Flatmates join completely free</p>
                </div>

                <div className="space-y-3 text-xs text-navy font-medium">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-mutedblue-dark">All Basic Plus Features, Plus:</div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Unlimited household members</strong> for six months</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Only the owner pays ₹99</strong> — other flatmates join free</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Advanced household expense management &amp; analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Unlimited custom bill categories (Maid, Security, Maintenance)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Complete household financial history &amp; audit tracking</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Existing members preserved on expiration (never kicked out)</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-cream">
                <button
                  onClick={() => handleHouseholdCheckout("premium")}
                  disabled={checkingOut === "premium"}
                  className="w-full py-3.5 rounded-2xl bg-navy hover:bg-navy-secondary text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-coral" />
                  {checkingOut === "premium" 
                    ? "Activating..." 
                    : currentHouseholdTier === "premium" 
                    ? "Renew Premium (₹99)" 
                    : "Upgrade to Premium"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: MARKETPLACE MEMBERSHIP (SEPARATE & DISTINCT) */}
        <div className="space-y-6 pt-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral/10 text-coral font-bold text-xs uppercase tracking-wider mb-2">
              <ShoppingBag className="w-3.5 h-3.5" />
              Campus Marketplace Offering
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy">Marketplace Membership</h2>
            <p className="text-xs text-navy-secondary mt-1">
              Independent from household subscriptions. Browsing is free forever; membership unlocks buying &amp; selling.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-card border-2 border-navy/10 relative overflow-hidden max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-coral text-white flex items-center justify-center font-bold shadow-md">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-navy">6-Month Marketplace Membership</h3>
                    <p className="text-xs text-mutedblue-dark font-medium">Independent buyer &amp; seller pass</p>
                  </div>
                </div>

                <p className="text-xs text-navy-secondary leading-relaxed">
                  Browsing and viewing marketplace listings is always <strong>100% free</strong> for every registered user. To publish product listings as a seller or initiate purchase transactions as a buyer, users get an active 6-month Marketplace Membership.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-navy font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Buy used furniture, appliances, cycles &amp; books</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Sell products with up to 8 photo uploads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Publish unlimited product listings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Direct buyer/seller chat interactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Moving Out &amp; Graduation Sale collections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Zero per-listing charges &amp; no buyer fees</span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-mutedblue-dark bg-cream/30 p-3 rounded-xl border border-navy/5">
                  <strong>Important:</strong> Household Premium does not include Marketplace Membership, and Marketplace Membership does not include Household Premium. Both are separate offerings.
                </div>
              </div>

              <div className="md:col-span-4 bg-navy text-white rounded-3xl p-6 text-center space-y-4 shadow-elevated">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-coral bg-coral/20 px-3 py-1 rounded-full">
                    6 Months Validity
                  </span>
                  <div className="mt-3 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black text-white">₹20</span>
                    <span className="text-xs text-mutedblue">/ 6 Months</span>
                  </div>
                  <p className="text-[11px] text-mutedblue mt-1">Unlimited buying &amp; selling</p>
                </div>

                {hasActiveMkt ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-500/30">
                      <ShieldCheck className="w-4 h-4" /> Active Membership
                    </div>
                    <p className="text-[11px] text-mutedblue">
                      Valid until: {mktExpiresAt ? mktExpiresAt.toLocaleDateString() : "6 Months"}
                    </p>
                    <button
                      onClick={handleMarketplaceMembershipCheckout}
                      disabled={checkingOut === "marketplace_membership"}
                      className="w-full py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold transition-all shadow-md"
                    >
                      {checkingOut === "marketplace_membership" ? "Renewing..." : "Renew Membership (+6 Months)"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleMarketplaceMembershipCheckout}
                    disabled={checkingOut === "marketplace_membership"}
                    className="w-full py-3.5 rounded-2xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-4 h-4" />
                    {checkingOut === "marketplace_membership" ? "Activating..." : "Get Marketplace Membership"}
                  </button>
                )}
                <p className="text-[10px] text-mutedblue">Secured with Razorpay verification</p>
              </div>
            </div>
          </div>
        </div>

        {/* COMPARISON MATRIX TABLE */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-navy/5 space-y-4 max-w-5xl mx-auto">
          <h3 className="font-extrabold text-lg text-navy">Plan Comparison at a Glance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-cream-dark text-mutedblue-dark uppercase font-bold text-[10px]">
                  <th className="py-3 px-3">Subscription</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Capacity</th>
                  <th className="py-3 px-3">Household Management</th>
                  <th className="py-3 px-3">Marketplace Buying/Selling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream font-medium text-navy">
                <tr>
                  <td className="py-3 px-3 font-bold">Free Plan</td>
                  <td className="py-3 px-3">₹0</td>
                  <td className="py-3 px-3">Forever</td>
                  <td className="py-3 px-3">1 individual user</td>
                  <td className="py-3 px-3 text-mutedblue-dark">Restricted</td>
                  <td className="py-3 px-3 text-mutedblue-dark">Browsing Only</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-coral">Basic Plus</td>
                  <td className="py-3 px-3 font-bold text-coral">₹49</td>
                  <td className="py-3 px-3">1 Year</td>
                  <td className="py-3 px-3">3 household members total</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Full Access</td>
                  <td className="py-3 px-3 text-mutedblue-dark">Browsing (Requires Mkt Pass)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold">Premium Household</td>
                  <td className="py-3 px-3 font-bold">₹99</td>
                  <td className="py-3 px-3">6 Months</td>
                  <td className="py-3 px-3">Unlimited household members</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Full Access + Unlimited</td>
                  <td className="py-3 px-3 text-mutedblue-dark">Browsing (Requires Mkt Pass)</td>
                </tr>
                <tr className="bg-coral/5">
                  <td className="py-3 px-3 font-bold text-coral">Marketplace Membership</td>
                  <td className="py-3 px-3 font-bold text-coral">₹20</td>
                  <td className="py-3 px-3">6 Months</td>
                  <td className="py-3 px-3">Individual user access</td>
                  <td className="py-3 px-3 text-mutedblue-dark">Independent</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Unlimited Buying &amp; Selling</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECURITY & PAYMENT NOTICE */}
        <div className="p-6 rounded-3xl bg-cream/40 border border-navy/10 flex items-start gap-4 max-w-5xl mx-auto">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-navy">Server-Side Payment Verification &amp; Local Test Simulation</h4>
            <p className="text-navy-secondary leading-relaxed">
              NestSync verifies every transaction cryptographically with HMAC-SHA256 signatures before activating subscriptions. In local development test mode, payment simulation generates realistic test keys and updates database subscription records without real money charges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
