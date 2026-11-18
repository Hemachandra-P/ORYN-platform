"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiRequest, setStoredToken, setStoredUser } from "@/lib/api";
import { Lock, Mail, ArrowRight, ShieldCheck, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setStoredToken(data.access_token);
      setStoredUser({
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        subscription_tier: data.subscription_tier,
      });

      if (data.role === "super_admin" || data.role === "platform_admin") {
        router.push("/admin");
      } else {
        router.push("/households");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-elevated border border-navy/5 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-navy text-coral font-black text-2xl flex items-center justify-center mx-auto mb-3">
              N
            </div>
            <h1 className="text-2xl font-bold text-navy">Welcome Back</h1>
            <p className="text-sm text-navy-secondary mt-1">Sign in to your NestSync account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-coral-light border border-coral/30 text-coral text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-mutedblue-dark absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy/15 focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral text-sm bg-cream/30 text-navy"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-mutedblue-dark absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy/15 focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral text-sm bg-cream/30 text-navy"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-coral hover:bg-coral-hover text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In to Account"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins for Instant Testing */}
          <div className="mt-8 pt-6 border-t border-cream">
            <p className="text-[11px] font-bold uppercase tracking-wider text-mutedblue-dark text-center mb-3">
              Fast Demo Accounts (Click to Autofill)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickLogin("rahul@example.com", "Pass@1234")}
                className="p-2 rounded-xl bg-cream/60 hover:bg-cream border border-navy/10 text-left text-xs transition-colors"
              >
                <p className="font-bold text-navy truncate">Rahul (Flat Owner)</p>
                <p className="text-[10px] text-mutedblue-dark">rahul@example.com</p>
              </button>

              <button
                type="button"
                onClick={() => fillQuickLogin("admin@nestsync.com", "Admin@NestSync2026!")}
                className="p-2 rounded-xl bg-navy text-white text-left text-xs transition-colors hover:bg-navy-secondary"
              >
                <p className="font-bold text-coral truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Super Admin
                </p>
                <p className="text-[10px] text-mutedblue">admin@nestsync.com</p>
              </button>

              <button
                type="button"
                onClick={() => fillQuickLogin("joy@example.com", "Pass@1234")}
                className="p-2 rounded-xl bg-cream/60 hover:bg-cream border border-navy/10 text-left text-xs transition-colors"
              >
                <p className="font-bold text-navy truncate">Joy (Flatmate)</p>
                <p className="text-[10px] text-mutedblue-dark">joy@example.com</p>
              </button>

              <button
                type="button"
                onClick={() => fillQuickLogin("arjun@example.com", "Pass@1234")}
                className="p-2 rounded-xl bg-cream/60 hover:bg-cream border border-navy/10 text-left text-xs transition-colors"
              >
                <p className="font-bold text-navy truncate">Arjun (Flatmate)</p>
                <p className="text-[10px] text-mutedblue-dark">arjun@example.com</p>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-navy-secondary">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-bold text-coral hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
