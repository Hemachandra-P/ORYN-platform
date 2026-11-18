"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  CreditCard, CheckCircle2, Sparkles, Shield, ArrowRight, 
  Clock, Zap, Check, AlertCircle 
} from "lucide-react";
import { apiRequest, getStoredToken, getStoredUser, setStoredUser } from "@/lib/api";

export default function SubscriptionsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [mySub, setMySub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const user = getStoredUser();
    setCurrentUser(user);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, subData] = await Promise.all([
        apiRequest("/subscriptions/plans"),
        apiRequest("/subscriptions/my-subscription"),
      ]);
      setPlans(plansData);
      setMySub(subData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setCheckoutLoading(planId);
    try {
      // 1. Create order
      const orderRes = await apiRequest("/subscriptions/checkout", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId }),
      });

      if (planId === "free") {
        showToast("Switched to Free Community Plan");
        if (currentUser) {
          const updated = { ...currentUser, subscription_tier: "free" };
          setCurrentUser(updated);
          setStoredUser(updated);
        }
        await loadData();
        return;
      }

      // 2. Local Simulation or Razorpay
      const simRes = await apiRequest(`/subscriptions/simulate-test-payment?order_id=${orderRes.order_id}`, {
        method: "POST",
      });

      // 3. Verify Payment
      const verifyRes = await apiRequest("/subscriptions/verify", {
        method: "POST",
        body: JSON.stringify({
          plan_id: planId,
          razorpay_order_id: simRes.razorpay_order_id,
          razorpay_payment_id: simRes.razorpay_payment_id,
          razorpay_signature: simRes.razorpay_signature,
          is_simulation: true,
        }),
      });

      showToast(verifyRes.message || "Payment verified & subscription activated!");

      if (currentUser) {
        const updated = { ...currentUser, subscription_tier: planId };
        setCurrentUser(updated);
        setStoredUser(updated);
      }

      await loadData();
    } catch (err: any) {
      showToast(err.message || "Checkout failed");
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <Navbar />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white px-5 py-3 rounded-2xl shadow-elevated border border-coral text-sm flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-coral" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-navy text-white px-4 sm:px-6 lg:px-8 py-12 border-b border-navy-secondary">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral/20 text-coral text-xs font-bold uppercase tracking-wider mb-3">
            <CreditCard className="w-3.5 h-3.5" /> Razorpay Test Mode & Transparent Annual Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Simple Annual Subscriptions</h1>
          <p className="text-sm text-mutedblue mt-2 max-w-xl mx-auto">
            Upgrade your household experience with unlimited AI voice automation, custom splits, and moving out bundle showcases.
          </p>

          {/* Current Tier Badge */}
          {mySub && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-navy-secondary border border-white/10 text-xs">
              <span className="text-mutedblue">Your Active Plan:</span>
              <span className="font-bold text-coral uppercase tracking-wide">
                {mySub.subscription_tier || "free"}
              </span>
              {mySub.subscription?.current_period_end && (
                <span className="text-mutedblue border-l border-white/10 pl-2">
                  Renews: {new Date(mySub.subscription.current_period_end).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PLANS COMPARISON GRID */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = (mySub?.subscription_tier || "free") === plan.id;
            const isPopular = plan.id === "basic_plus";
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-8 flex flex-col justify-between shadow-card relative transition-all ${
                  isPopular ? "border-2 border-coral shadow-elevated" : "border border-navy/5"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-coral text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                    Roommate Favorite
                  </span>
                )}

                <div>
                  <h3 className="font-bold text-xl text-navy">{plan.name}</h3>
                  <p className="text-xs text-navy-secondary mt-1">{plan.description}</p>

                  <div className="mt-6 mb-6">
                    <span className="text-4xl font-black text-navy">₹{plan.price_inr_year}</span>
                    <span className="text-xs text-mutedblue-dark ml-1">/year</span>
                  </div>

                  <ul className="space-y-3 text-xs text-navy-secondary">
                    {plan.features?.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-cream">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-cream text-navy font-bold text-xs cursor-default flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-emerald-600" /> Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={checkoutLoading === plan.id}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 ${
                        isPopular
                          ? "bg-coral hover:bg-coral-hover text-white"
                          : "bg-navy hover:bg-navy-secondary text-white"
                      }`}
                    >
                      {checkoutLoading === plan.id
                        ? "Verifying Payment..."
                        : `Activate ${plan.name} (₹${plan.price_inr_year})`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security / Razorpay Assurance Note */}
        <div className="mt-12 bg-white rounded-3xl p-6 shadow-card border border-navy/5 flex flex-col sm:flex-row items-center gap-4 text-xs text-navy-secondary">
          <div className="w-10 h-10 rounded-2xl bg-coral/10 text-coral flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-navy">Secure Server-Side Cryptographic Signature Verification</p>
            <p className="mt-0.5">
              NestSync implements server-side HMAC-SHA256 signature verification and webhook idempotency checks. Subscriptions are never activated purely on frontend client signals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
