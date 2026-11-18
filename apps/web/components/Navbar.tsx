"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import { getStoredUser, removeStoredToken } from "@/lib/api";
import VynaLogo from "@/components/VynaLogo";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setUser(getStoredUser()); setOpen(false); }, [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const logout = () => { removeStoredToken(); setUser(null); router.push("/auth/login"); };

  const links = [
    { name: "Household", href: "/households" },
    { name: "Marketplace", href: "/marketplace" },
    ...(user ? [{ name: "My listings", href: "/marketplace/my-listings" }] : []),
    { name: "Moving out", href: "/marketplace/moving-out" },
    { name: "Plans", href: "/subscriptions" },
    ...(user && (user.role === "platform_admin" || user.role === "super_admin") ? [{ name: "Admin", href: "/admin" }] : []),
  ];

  // The most specific match wins, so Marketplace is not highlighted on My listings.
  const activeHref = links.map((l) => l.href).filter((h) => pathname === h || pathname.startsWith(h + "/")).sort((a, b) => b.length - a.length)[0];

  return (
    <header className={`sticky top-0 z-50 transition-all ${scrolled ? "bg-white/85 backdrop-blur-md border-b border-navy/10" : "border-b border-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Vyna home"><VynaLogo size={32} /></Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {links.map((l) => {
            const active = l.href === activeHref;
            return (
              <Link key={l.href} href={l.href} className={`relative px-3.5 py-2 text-sm font-medium rounded-lg ${active ? "text-navy" : "text-mist-dark hover:text-navy"}`}>
                {l.name}
                {active && <motion.span layoutId="nav-underline" className="absolute left-3.5 right-3.5 -bottom-0.5 h-0.5 rounded-full bg-coral" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link href="/households" className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-navy/10 bg-white hover:border-navy/25">
                <span className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">{(user.full_name || "?").charAt(0).toUpperCase()}</span>
                <span className="text-sm font-medium max-w-[110px] truncate">{user.full_name}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-coral">{user.subscription_tier || "free"}</span>
              </Link>
              <button onClick={logout} title="Sign out" aria-label="Sign out" className="p-2 rounded-lg text-mist-dark hover:text-coral hover:bg-white"><LogOut className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-navy hover:text-coral">Sign in</Link>
              <Link href="/auth/register" className="px-4 py-2 rounded-xl text-sm font-semibold bg-navy text-white hover:bg-coral">Create account</Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} className="md:hidden p-2 rounded-lg text-navy hover:bg-white">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden overflow-hidden bg-white border-t border-navy/10">
            <div className="px-4 py-3 space-y-1">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={`block px-3 py-3 rounded-xl text-sm font-medium ${l.href === activeHref ? "bg-paper text-navy" : "text-mist-dark"}`}>{l.name}</Link>
              ))}
              <div className="pt-3 mt-2 border-t border-navy/10 flex gap-2">
                {user ? (
                  <button onClick={logout} className="flex-1 py-3 rounded-xl text-sm font-semibold text-coral border border-coral/30">Sign out</button>
                ) : (
                  <>
                    <Link href="/auth/login" className="flex-1 text-center py-3 rounded-xl text-sm font-semibold border border-navy/15">Sign in</Link>
                    <Link href="/auth/register" className="flex-1 text-center py-3 rounded-xl text-sm font-semibold bg-navy text-white">Create account</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
