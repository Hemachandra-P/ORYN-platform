"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Receipt, ListChecks, Store } from "lucide-react";
import Navbar from "@/components/Navbar";
import OrynLogo from "@/components/OrynLogo";
import Reveal from "@/components/Reveal";
import { apiRequest, getStoredToken } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* Hero signature: a shared bill that splits itself across the flat.   */
/* ------------------------------------------------------------------ */

const FLATMATES = ["Joy", "Rohan", "Karthik", "Bharath", "Tarun", "Kedhar"];
const TOTAL = 1200;
const SHARE = TOTAL / FLATMATES.length;
const STEPS = FLATMATES.length * 2 + 3; // split, settle, hold

function FlatLedger() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? STEPS : 0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStep((s) => (s >= STEPS ? 0 : s + 1)), 650);
    return () => clearInterval(id);
  }, [reduce]);

  const splitDone = step >= FLATMATES.length;
  const settledCount = Math.max(0, Math.min(FLATMATES.length - 1, step - FLATMATES.length));
  const allSettled = settledCount >= FLATMATES.length - 1;
  const owed = TOTAL - SHARE - settledCount * SHARE;

  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
      {/* paper receipt */}
      <div className="relative bg-white rounded-2xl shadow-elevated border border-navy/10 overflow-hidden">
        <div className="px-6 pt-6 pb-5 border-b border-dashed border-navy/20">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-mist-dark">
            <span>Skyline · Flat 402</span>
            <span>Shared ledger</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-sm text-mist-dark">Weekly groceries</p>
              <p className="font-mono text-3xl font-semibold tabular mt-1">₹{TOTAL.toLocaleString("en-IN")}.00</p>
            </div>
            <p className="text-xs text-mist-dark text-right">Paid by <span className="font-semibold text-navy">{FLATMATES[0]}</span><br />Split {FLATMATES.length} ways</p>
          </div>
        </div>

        <ul className="px-6 py-3">
          {FLATMATES.map((name, i) => {
            const shown = step > i;
            const isPayer = i === 0;
            const settled = isPayer || (i - 1 < settledCount);
            return (
              <li key={name} className="flex items-center gap-3 py-2.5">
                <span className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${isPayer ? "bg-navy text-white" : "bg-paper text-navy border border-navy/10"}`}>{name[0]}</span>
                <span className="text-sm font-medium flex-1">{name}</span>
                <motion.span
                  animate={{ opacity: shown || reduce ? 1 : 0.15, x: shown || reduce ? 0 : 6 }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-sm tabular text-navy"
                >
                  ₹{SHARE.toLocaleString("en-IN")}
                </motion.span>
                <span className="w-[74px] text-right">
                  {splitDone && (
                    <motion.span
                      key={settled ? "s" : "o"}
                      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${settled ? "bg-mint-light text-mint" : "bg-sun-light text-[#8A6100]"}`}
                    >
                      {settled ? <><Check className="w-3 h-3" />{isPayer ? "Paid" : "Settled"}</> : "Owes"}
                    </motion.span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="px-6 py-4 bg-paper border-t border-navy/10 flex items-center justify-between">
          <span className="text-xs text-mist-dark">{allSettled ? "Everyone is square" : `Still owed to ${FLATMATES[0]}`}</span>
          <span className={`font-mono text-lg font-semibold tabular ${allSettled ? "text-mint" : "text-navy"}`}>
            {allSettled ? "₹0" : `₹${Math.round(owed).toLocaleString("en-IN")}`}
          </span>
        </div>
      </div>

      {/* chore note stuck on the side */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="hidden sm:block absolute -left-12 -bottom-14 bg-sun rounded-lg px-4 py-3 shadow-card text-sm font-medium w-44"
      >
        <span className="block text-[10px] font-mono uppercase tracking-wider text-navy/60 mb-0.5">Sunday</span>
        Karthik · clean the stove
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const PLANS = [
  { name: "Free", price: "₹0", per: "forever", who: "1 person", points: ["Account on web and mobile", "Browse marketplace previews"], cta: "Start free", href: "/auth/register" },
  { name: "Basic Plus", price: "₹49", per: "per year", who: "Up to 3 flatmates", points: ["Expense splits to the paisa", "Bills, shopping list, chores", "Monthly spending report"], cta: "Choose Basic Plus", href: "/subscriptions", featured: true },
  { name: "Premium", price: "₹99", per: "per 6 months", who: "Unlimited flatmates", points: ["Everything in Basic Plus", "Only the owner pays", "Analytics and full history"], cta: "Choose Premium", href: "/subscriptions" },
];

export default function LandingPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { setSignedIn(!!getStoredToken()); }, []);
  // Signed-in visitors go straight to their flats instead of the register page.
  const startHref = signedIn ? "/households" : "/auth/register";

  useEffect(() => {
    apiRequest("/marketplace/?sort_by=newest")
      .then((data) => setListings(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setListings([]));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-navy">
      <Navbar />

      {/* HERO */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-20 md:pt-16 md:pb-28 overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-0 opacity-[0.55]" style={{ backgroundImage: "radial-gradient(#C9D1DE 1px, transparent 1px)", backgroundSize: "22px 22px", maskImage: "linear-gradient(to bottom, black, transparent 85%)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)" }} />
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-8 items-center">
          <div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-mist-dark mb-5">
              For flats, PGs and hostels near campus
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.6 }} className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[0.98] tracking-tight">
              One ledger<br />for the whole<br /><span className="text-coral">flat.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="mt-6 text-lg text-navy-secondary max-w-lg leading-relaxed">
              Log who paid, split it to the paisa, hand out chores, and sell the mini-fridge when you move out. Everyone sees the same numbers.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }} className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link href={startHref} className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-navy text-white font-semibold hover:bg-coral shadow-card">
                {signedIn ? "Go to your household" : "Create your household"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/marketplace" className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-navy/15 bg-white font-semibold hover:border-navy/40">
                Browse the marketplace
              </Link>
            </motion.div>
            <p className="mt-5 text-sm text-mist-dark">Free to start. Households from ₹49 a year.</p>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}>
            <FlatLedger />
          </motion.div>
        </div>
      </section>

      {/* WHAT IT DOES */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-white border-y border-navy/10">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <h2 className="font-display font-bold text-3xl sm:text-4xl max-w-xl leading-tight">Everything a shared flat argues about, written down.</h2>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-x-10 gap-y-12">
            {[
              { icon: Receipt, title: "Expenses and bills", text: "Rent, WiFi, groceries. Split equally, by amount or by percentage, and settle up over UPI with a reference on record." },
              { icon: ListChecks, title: "Shopping list and chores", text: "Whoever is at the shop ticks things off. Chores go to a named flatmate, and they get a notification." },
              { icon: Store, title: "Campus marketplace", text: "Chairs, cycles, fridges and textbooks from seniors nearby. Moving-out sales are grouped so nothing goes to waste." },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="group">
                  <div className="w-11 h-11 rounded-xl bg-paper border border-navy/10 flex items-center justify-center group-hover:bg-coral group-hover:border-coral transition-colors">
                    <f.icon className="w-5 h-5 text-navy group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="mt-5 font-display font-bold text-xl">{f.title}</h3>
                  <p className="mt-2 text-navy-secondary leading-relaxed">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETPLACE */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl">Just listed near you</h2>
              <p className="mt-2 text-navy-secondary">Browsing is always free. A ₹20 membership lets you buy, sell and message sellers.</p>
            </div>
            <Link href="/marketplace" className="group inline-flex items-center gap-1.5 font-semibold text-coral">
              See all listings <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Reveal>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.length === 0 && [0, 1, 2].map((i) => <div key={i} className="h-72 rounded-2xl bg-white border border-navy/10 animate-pulse" />)}
            {listings.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.08}>
                <Link href={`/marketplace/${item.id}`} className="group block bg-white rounded-2xl overflow-hidden border border-navy/10 hover:shadow-elevated hover:-translate-y-1">
                  <div className="aspect-[4/3] bg-paper overflow-hidden relative">
                    {item.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.images[0].image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-mist-dark">No photo</div>
                    )}
                    {item.is_moving_out_sale && <span className="absolute top-3 left-3 bg-sun text-navy text-xs font-semibold px-2.5 py-1 rounded-md">Moving out sale</span>}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display font-bold text-lg leading-snug line-clamp-1">{item.title}</h3>
                      {item.selling_price_paise != null && <span className="font-mono font-semibold tabular shrink-0">₹{(item.selling_price_paise / 100).toLocaleString("en-IN")}</span>}
                    </div>
                    <p className="mt-1.5 text-sm text-navy-secondary line-clamp-2">{item.description}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-white border-y border-navy/10">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <h2 className="font-display font-bold text-3xl sm:text-4xl">Priced for a student budget</h2>
            <p className="mt-2 text-navy-secondary max-w-xl">Pay once for the household. Flatmates on a Premium plan join free.</p>
          </Reveal>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {PLANS.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.08}>
                <div className={`h-full flex flex-col rounded-2xl p-7 border ${p.featured ? "border-navy bg-navy text-white shadow-elevated" : "border-navy/10 bg-paper-light"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-xl">{p.name}</h3>
                    {p.featured && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-coral text-white">Most picked</span>}
                  </div>
                  <p className={`text-sm mt-1 ${p.featured ? "text-white/70" : "text-mist-dark"}`}>{p.who}</p>
                  <p className="mt-6 flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-semibold tabular">{p.price}</span>
                    <span className={`text-sm ${p.featured ? "text-white/70" : "text-mist-dark"}`}>{p.per}</span>
                  </p>
                  <ul className="mt-6 space-y-2.5 flex-1">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex gap-2.5 text-sm"><Check className={`w-4 h-4 mt-0.5 shrink-0 ${p.featured ? "text-coral" : "text-mint"}`} />{pt}</li>
                    ))}
                  </ul>
                  <Link href={signedIn && p.href === "/auth/register" ? "/households" : p.href} className={`mt-8 text-center py-3 rounded-xl text-sm font-semibold ${p.featured ? "bg-coral text-white hover:bg-coral-hover" : "bg-navy text-white hover:bg-coral"}`}>{signedIn && p.href === "/auth/register" ? "Open your household" : p.cta}</Link>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-6 rounded-2xl border border-navy/10 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <h3 className="font-display font-bold text-lg">Marketplace membership <span className="font-mono text-coral ml-2">₹20 / 6 months</span></h3>
                <p className="mt-1 text-sm text-navy-secondary max-w-2xl">Separate from household plans. Unlocks prices, seller contact and checkout, and lets you list unlimited items with no commission.</p>
              </div>
              <Link href="/subscriptions" className="shrink-0 px-6 py-3 rounded-xl border border-navy/15 text-sm font-semibold hover:border-navy/40 text-center">Get membership</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 text-center">
        <Reveal>
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight max-w-2xl mx-auto">Stop keeping score in the group chat.</h2>
          <Link href={startHref} className="group mt-9 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-coral text-white font-semibold hover:bg-coral-hover shadow-card">
            {signedIn ? "Go to your household" : "Create your household"} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-navy/10 bg-white px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 md:items-start justify-between">
          <div>
            <OrynLogo size={30} />
            <p className="mt-3 text-sm text-mist-dark max-w-xs">Everything shared. Everything simple.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-sm">
            <Link href="/households" className="text-navy-secondary hover:text-coral">Household</Link>
            <Link href="/marketplace" className="text-navy-secondary hover:text-coral">Marketplace</Link>
            <Link href="/marketplace/moving-out" className="text-navy-secondary hover:text-coral">Moving out sales</Link>
            <Link href="/marketplace/sell" className="text-navy-secondary hover:text-coral">Sell an item</Link>
            <Link href="/subscriptions" className="text-navy-secondary hover:text-coral">Plans</Link>
            <Link href="/auth/login" className="text-navy-secondary hover:text-coral">Sign in</Link>
          </div>
        </div>
        <p className="max-w-7xl mx-auto mt-8 text-xs text-mist-dark">© 2026 ORYN</p>
      </footer>
    </div>
  );
}
