"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Home, ShoppingBag, ShieldCheck, CreditCard, Sparkles, 
  Bell, LogOut, User as UserIcon, Menu, X, ArrowRight
} from "lucide-react";
import { getStoredToken, getStoredUser, removeStoredToken } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  const handleLogout = () => {
    removeStoredToken();
    setUser(null);
    router.push("/auth/login");
  };

  const navLinks = [
    { name: "Household Hub", href: "/households", icon: Home },
    { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
    { name: "Moving Out Sales", href: "/marketplace/moving-out", icon: Sparkles },
    { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  ];

  if (user && (user.role === "platform_admin" || user.role === "super_admin")) {
    navLinks.push({ name: "Admin Panel", href: "/admin", icon: ShieldCheck });
  }

  return (
    <nav className="sticky top-0 z-50 bg-navy text-white shadow-elevated border-b border-navy-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center font-black text-white text-lg shadow-md group-hover:scale-105 transition-transform">
                N
              </div>
              <span className="font-bold text-xl tracking-tight text-white flex items-center">
                Nest<span className="text-coral">Sync</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-navy-secondary text-white font-semibold shadow-sm"
                      : "text-mutedblue hover:text-white hover:bg-navy-secondary/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-coral" : "text-mutedblue"}`} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* User controls / Auth actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/households"
                  className="px-3 py-1.5 rounded-lg bg-navy-secondary text-xs text-mutedblue flex items-center gap-2 hover:text-white transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="max-w-[120px] truncate">{user.full_name}</span>
                  <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-coral/20 text-coral font-bold">
                    {user.subscription_tier || "free"}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-mutedblue hover:text-coral hover:bg-navy-secondary rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-white hover:text-coral transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-coral hover:bg-coral-hover text-white shadow-md hover:shadow-lg transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-mutedblue hover:text-white hover:bg-navy-secondary"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-secondary px-4 pt-2 pb-6 space-y-2 border-t border-navy">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-navy"
            >
              <link.icon className="w-4 h-4 text-coral" />
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-navy/50">
            {user ? (
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full text-left px-3 py-2 text-sm text-coral font-semibold flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out ({user.full_name})
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-sm font-medium bg-navy text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-coral text-white"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
