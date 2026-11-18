"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import OrynLogo from "@/components/OrynLogo";
import { apiRequest, setStoredToken, setStoredUser } from "@/lib/api";
import { Lock, Mail, ArrowRight, User, MapPin } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("Chennai");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          city,
        }),
      });

      setStoredToken(data.access_token);
      setStoredUser({
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        subscription_tier: data.subscription_tier,
      });

      router.push("/households");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-elevated border border-navy/5 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <OrynLogo variant="symbol" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-navy">Join ORYN</h1>
            <p className="text-sm text-navy-secondary mt-1">Everything Shared. Everything Simple.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-coral-light border border-coral/30 text-coral text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-mist-dark absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy/15 focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral text-sm bg-paper/30 text-navy"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-mist-dark absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy/15 focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral text-sm bg-paper/30 text-navy"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-mist-dark absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy/15 focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral text-sm bg-paper/30 text-navy"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                City / Campus Area
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-mist-dark absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Chennai, Kattankulathur, etc."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy/15 focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral text-sm bg-paper/30 text-navy"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-coral hover:bg-coral-hover text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Complete Registration"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-navy-secondary">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-bold text-coral hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
