"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  Users, Receipt, Sparkles, ShoppingBag, ArrowRight, CheckCircle2, 
  Shield, Zap, HeartHandshake, Mic, Bell, RefreshCw, ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function LandingPage() {
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);

  useEffect(() => {
    // Fetch live marketplace items
    apiRequest("/marketplace/?sort_by=newest")
      .then((data) => setFeaturedListings(data.slice(0, 3)))
      .catch((err) => console.log("Listings fetch fallback", err));
  }, []);

  const [workflowDemos] = useState([
    {
      query: "Rahul paid ₹1,200 for weekly groceries. Split equally with flatmates.",
      intent: "Penny-Accurate Expense Splitting",
      result: "Logged ₹1,200 under Groceries. Created 3 equal shares of ₹400 with paise precision. Updated roommate net balances and settlement ledgers instantly."
    },
    {
      query: "Running low on dish soap, olive oil and basmati rice.",
      intent: "Collaborative Shopping List",
      result: "Added items to Skyline 402 shared shopping list. Any flatmate at the supermarket can check off items with one tap."
    },
    {
      query: "Assign kitchen stove cleaning to Joy every Sunday.",
      intent: "Flatmate Chore Delegation",
      result: "Scheduled weekly chore assigned to Joy Mukherjee. Automatic in-app notification sent to the assigned flatmate."
    }
  ]);
  const [activeWorkflowDemo, setActiveWorkflowDemo] = useState<number>(0);

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 border-b border-cream-dark">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy/5 text-navy font-semibold text-xs tracking-wide uppercase mb-6 border border-navy/10">
            <span className="w-2 h-2 rounded-full bg-coral animate-ping"></span>
            Built for Flats, Hostels, PGs & Shared Homes
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-navy max-w-4xl mx-auto leading-tight">
            Shared living, <span className="text-coral underline decoration-wavy decoration-2">stress-free</span> expenses & campus marketplace.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-navy-secondary max-w-2xl mx-auto font-normal">
            Track flatmate bills with penny-accurate splits, organize chores &amp; shared responsibilities, and buy or sell used furniture &amp; appliances in your community.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-coral hover:bg-coral-hover text-white font-bold text-base shadow-elevated hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
              Start Your Household Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/marketplace"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-cream-light text-navy font-bold text-base border border-navy/15 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 text-coral" />
              Browse Campus Marketplace
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-5 rounded-2xl shadow-card border border-navy/5 text-left">
              <p className="text-3xl font-black text-navy">₹0.00</p>
              <p className="text-xs text-mutedblue-dark font-medium mt-1">Float Error Rate (Paise Precision)</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-card border border-navy/5 text-left">
              <p className="text-3xl font-black text-coral">100%</p>
              <p className="text-xs text-mutedblue-dark font-medium mt-1">Household Data Isolation</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-card border border-navy/5 text-left">
              <p className="text-3xl font-black text-navy">₹49/yr</p>
              <p className="text-xs text-mutedblue-dark font-medium mt-1">Affordable Annual Student Plans</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-card border border-navy/5 text-left">
              <p className="text-base sm:text-lg font-black text-navy leading-tight">Smart Household Management</p>
              <p className="text-xs text-mutedblue-dark font-medium mt-1">Expenses, bills, tasks and shared responsibilities — organized in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE 4 PLATFORM PILLARS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-coral">Everything in one ecosystem</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-navy mt-2">
            Designed for real roommates and student communities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white p-7 rounded-3xl shadow-card border border-navy/5 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center mb-5">
              <Receipt className="w-6 h-6 text-coral" />
            </div>
            <h3 className="font-bold text-xl text-navy mb-2">Split Expenses & Bills</h3>
            <p className="text-sm text-navy-secondary leading-relaxed">
              Log grocery runs, WiFi, electricity, or rent. Equal, custom, or percentage splits with UPI transaction references and debt settlement history.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white p-7 rounded-3xl shadow-card border border-navy/5 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center mb-5">
              <Users className="w-6 h-6 text-coral" />
            </div>
            <h3 className="font-bold text-xl text-navy mb-2">Shared Shopping & Tasks</h3>
            <p className="text-sm text-navy-secondary leading-relaxed">
              Sync what’s out of stock in real-time. Assign cleaning chores or bill due dates to specific flatmates so no one forgets their turn.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white p-7 rounded-3xl shadow-card border border-navy/5 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-coral text-white flex items-center justify-center mb-5">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl text-navy mb-2">Second-Hand Market</h3>
            <p className="text-sm text-navy-secondary leading-relaxed">
              Buy & sell study chairs, mini fridges, cycles and books from seniors and neighbors with in-app chat and moving-out sale collections.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white p-7 rounded-3xl shadow-card border border-navy/5 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center mb-5">
              <CheckCircle2 className="w-6 h-6 text-coral" />
            </div>
            <h3 className="font-bold text-xl text-navy mb-2">Chore Delegation & Tasks</h3>
            <p className="text-sm text-navy-secondary leading-relaxed">
              Assign kitchen cleaning, trash duty or supermarket errands to specific flatmates. Shared checklists and transparent balance ledgers keep everyone accountable.
            </p>
          </div>
        </div>
      </section>

      {/* SMART HOUSEHOLD WORKFLOW SHOWCASE */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-navy text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="px-3 py-1 rounded-full bg-coral/20 text-coral font-bold text-xs uppercase tracking-wider">
              Smart Household Workflows
            </span>
            <h2 className="text-3xl font-extrabold mt-3">Shared living, organized effortlessly</h2>
            <p className="text-mutedblue text-sm mt-2">
              Expenses, bills, shopping lists, and chores — structured and transparent for every roommate.
            </p>
          </div>

          <div className="bg-navy-secondary rounded-3xl p-6 sm:p-8 border border-white/10 shadow-elevated">
            <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
              {workflowDemos.map((demo, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveWorkflowDemo(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeWorkflowDemo === idx 
                      ? "bg-coral text-white shadow-md" 
                      : "bg-navy text-mutedblue hover:text-white"
                  }`}
                >
                  Feature {idx + 1}: {demo.intent}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-navy/60 p-4 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-coral/20 text-coral flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-mutedblue uppercase font-semibold tracking-wider">Household Activity</p>
                  <p className="text-base font-medium text-white mt-1">
                    &quot;{workflowDemos[activeWorkflowDemo].query}&quot;
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-navy/90 p-4 rounded-2xl border border-emerald-500/30">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-emerald-400 uppercase font-semibold tracking-wider">Automated Ledger &amp; Sync</p>
                    <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      SYNCED
                    </span>
                  </div>
                  <p className="text-sm text-cream mt-1 leading-relaxed">
                    {workflowDemos[activeWorkflowDemo].result}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARKETPLACE FEATURED PREVIEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-coral">Community Marketplace</h2>
            <p className="text-3xl font-extrabold text-navy mt-1">Popular second-hand listings</p>
          </div>
          <Link
            href="/marketplace"
            className="mt-4 sm:mt-0 font-bold text-sm text-coral hover:text-coral-hover flex items-center gap-1 group"
          >
            Explore all items <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredListings.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-card border border-navy/5 flex flex-col group hover:shadow-elevated transition-all">
              <div className="h-48 overflow-hidden relative bg-navy/5">
                {item.images?.[0] ? (
                  <img
                    src={item.images[0].image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-mutedblue text-sm">No Photo</div>
                )}
                {item.is_moving_out_sale && (
                  <span className="absolute top-3 left-3 bg-coral text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                    Moving Out Sale
                  </span>
                )}
                <span className="absolute bottom-3 right-3 bg-navy/85 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                  ₹{(item.selling_price_paise / 100).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-mutedblue-dark mb-1">
                    <span className="capitalize font-medium">{item.category}</span>
                    <span className="capitalize px-2 py-0.5 rounded bg-cream font-bold text-navy text-[10px]">
                      {item.condition?.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-navy line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-navy-secondary mt-1 line-clamp-2">{item.description}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-cream flex items-center justify-between text-xs">
                  <span className="text-mutedblue-dark">{item.location}</span>
                  <Link
                    href={`/marketplace/${item.id}`}
                    className="font-bold text-coral hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-cream-light border-y border-cream-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-coral">Fair &amp; Transparent Pricing</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-navy mt-1">Household Plans &amp; Campus Marketplace</p>
            <p className="text-navy-secondary text-sm mt-2">
              Free individual browsing, affordable household plans for flatmates, and a ₹20 membership for buying and selling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* 1. Free Plan */}
            <div className="bg-white p-8 rounded-3xl shadow-card border border-navy/5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cream text-navy">
                  Individual Only
                </span>
                <h3 className="font-bold text-xl text-navy mt-2">Free Plan</h3>
                <p className="text-xs text-mutedblue-dark mt-1">One individual user account</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-navy">₹0</span>
                  <span className="text-xs text-mutedblue-dark ml-1">/ Free Forever</span>
                </div>
                <ul className="space-y-3 text-xs text-navy-secondary">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 1 Individual user account
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Log in &amp; access web and mobile apps
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Browse community marketplace for free
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> View public listings &amp; product details
                  </li>
                  <li className="pt-2 text-[11px] text-mutedblue-dark border-t border-cream">
                    Cannot create or join households. Upgrade to Basic Plus to manage flat expenses.
                  </li>
                </ul>
              </div>
              <Link
                href="/auth/register"
                className="mt-8 w-full py-3 rounded-xl bg-navy text-white text-center font-bold text-xs hover:bg-navy-secondary transition-all"
              >
                Get Started Free
              </Link>
            </div>

            {/* 2. Basic Plus Plan (₹49/year) */}
            <div className="bg-white p-8 rounded-3xl shadow-elevated border-2 border-coral relative flex flex-col justify-between">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-coral text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                Most Popular
              </span>
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-coral-light text-coral">
                  Up to 3 Flatmates
                </span>
                <h3 className="font-bold text-xl text-navy mt-2">Basic Plus</h3>
                <p className="text-xs text-mutedblue-dark mt-1">Up to 3 total household members</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-coral">₹49</span>
                  <span className="text-xs text-mutedblue-dark ml-1">/ 1 Year</span>
                </div>
                <ul className="space-y-3 text-xs text-navy-secondary">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Create 1 household with up to 3 members
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Shared expense tracking down to paise
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Equal, custom &amp; percentage splitting
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Recurring &amp; custom bill management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Shared shopping lists
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Task assignment &amp; flatmate delegation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Household activity history &amp; monthly reports
                  </li>
                </ul>
              </div>
              <Link
                href="/subscriptions"
                className="mt-8 w-full py-3 rounded-xl bg-coral text-white text-center font-bold text-xs hover:bg-coral-hover shadow-md transition-all"
              >
                Upgrade to Basic Plus
              </Link>
            </div>

            {/* 3. Premium Household Plan (₹99 / 6 months) */}
            <div className="bg-white p-8 rounded-3xl shadow-card border border-navy/5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Unlimited Flatmates
                </span>
                <h3 className="font-bold text-xl text-navy mt-2">Premium Household</h3>
                <p className="text-xs text-mutedblue-dark mt-1">Unlimited members for large flats</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-navy">₹99</span>
                  <span className="text-xs text-mutedblue-dark ml-1">/ 6 Months</span>
                </div>
                <ul className="space-y-3 text-xs text-navy-secondary">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited household members
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> All Basic Plus features included
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Only owner pays ₹99 — flatmates join free
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Advanced expense management &amp; analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited custom bill categories
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Complete financial history
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Existing members preserved on expiry
                  </li>
                </ul>
              </div>
              <Link
                href="/subscriptions"
                className="mt-8 w-full py-3 rounded-xl bg-navy text-white text-center font-bold text-xs hover:bg-navy-secondary transition-all"
              >
                Upgrade to Premium
              </Link>
            </div>
          </div>

          {/* SEPARATE 4TH OFFERING: MARKETPLACE MEMBERSHIP */}
          <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-navy/10 relative overflow-hidden max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-coral/10 text-coral flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                  <h3 className="text-xl font-black text-navy">Marketplace Membership</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                    Independent Offering
                  </span>
                </div>
                <p className="text-xs text-navy-secondary leading-relaxed">
                  Browsing and viewing marketplace listings is always <strong>100% free</strong>. An active Marketplace Membership unlocks unlimited buying and selling of used study furniture, appliances, cycles, and textbooks with <strong>zero per-listing charges</strong> and no separate buyer fees.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-semibold text-navy">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Buy &amp; sell products
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Publish unlimited listings
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Direct buyer/seller chat
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Moving Out sale collections
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Zero per-listing charges
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 6 months active validity
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 bg-cream/40 rounded-2xl p-6 border border-navy/10 text-center space-y-3">
                <div>
                  <p className="text-[11px] uppercase font-bold text-mutedblue-dark">Marketplace Access</p>
                  <div className="mt-1 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black text-navy">₹20</span>
                    <span className="text-xs font-bold text-navy-secondary">/ 6 Months</span>
                  </div>
                </div>
                <Link
                  href="/subscriptions"
                  className="w-full py-3 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4" />
                  Get Marketplace Membership
                </Link>
                <p className="text-[10px] text-mutedblue-dark">Independent of household subscriptions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SAMPLE TESTIMONIALS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-coral">Community Feedback</h2>
          <p className="text-3xl font-extrabold text-navy mt-1">Trusted by students &amp; young professionals</p>
          <p className="text-xs text-mutedblue-dark mt-2 font-mono">(Sample pilot cohort experiences)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-card border border-navy/5">
            <p className="text-sm text-navy-secondary italic">
              &quot;In our flat of six, calculating who paid for milk and groceries used to cause weekly friction. With NestSync, we log it instantly and settle via UPI in seconds.&quot;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-coral/20 font-bold text-coral flex items-center justify-center text-xs">
                RS
              </div>
              <div>
                <p className="font-bold text-xs text-navy">Rahul S.</p>
                <p className="text-[11px] text-mutedblue-dark">B.Tech 3rd Year, SRM Kattankulathur</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-card border border-navy/5">
            <p className="text-sm text-navy-secondary italic">
              &quot;The Moving Out Sale collection was a lifesaver when our senior moved out. We bought his microwave and mini-fridge for half the market price without any middleman.&quot;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-navy/10 font-bold text-navy flex items-center justify-center text-xs">
                JM
              </div>
              <div>
                <p className="font-bold text-xs text-navy">Joy M.</p>
                <p className="text-[11px] text-mutedblue-dark">Skyline Heights Resident</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-card border border-navy/5">
            <p className="text-sm text-navy-secondary italic">
              &quot;The split calculator handles complex splits effortlessly, like &apos;Rahul paid 450, split with everyone except Joy&apos;. It removes the tedious manual math completely.&quot;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 font-bold text-emerald-600 flex items-center justify-center text-xs">
                AP
              </div>
              <div>
                <p className="font-bold text-xs text-navy">Arjun P.</p>
                <p className="text-[11px] text-mutedblue-dark">Abode Valley PG Flatmate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-navy text-white pt-12 pb-8 px-4 sm:px-6 lg:px-8 border-t border-navy-secondary">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-coral flex items-center justify-center font-bold text-white text-sm">
                N
              </div>
              <span className="font-bold text-lg text-white">Nest<span className="text-coral">Sync</span></span>
            </div>
            <p className="text-xs text-mutedblue leading-relaxed">
              Unified digital platform for modern shared living and community second-hand marketplaces.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-coral mb-3">Household Hub</h4>
            <ul className="space-y-2 text-xs text-mutedblue">
              <li><Link href="/households" className="hover:text-white">Expense Tracker</Link></li>
              <li><Link href="/households" className="hover:text-white">Shared Shopping Lists</Link></li>
              <li><Link href="/households" className="hover:text-white">Recurring Bills</Link></li>
              <li><Link href="/households" className="hover:text-white">Chores & Tasks</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-coral mb-3">Marketplace</h4>
            <ul className="space-y-2 text-xs text-mutedblue">
              <li><Link href="/marketplace" className="hover:text-white">Buy Second-Hand</Link></li>
              <li><Link href="/marketplace/sell" className="hover:text-white">Publish a Listing</Link></li>
              <li><Link href="/marketplace/moving-out" className="hover:text-white">Moving Out Sales</Link></li>
              <li><Link href="/subscriptions" className="hover:text-white">Pricing Plans</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-coral mb-3">Administration</h4>
            <ul className="space-y-2 text-xs text-mutedblue">
              <li><Link href="/admin" className="hover:text-white">Creator / Admin Panel</Link></li>
              <li><Link href="http://localhost:8000/docs" target="_blank" className="hover:text-white">FastAPI Swagger Docs</Link></li>
              <li><Link href="/auth/login" className="hover:text-white">Platform Sign In</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-mutedblue">
          <p>© 2026 NestSync Platform. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[11px]">Primary Navy #14213D · Cream #F4EDE0 · Coral #FF6B5B</p>
        </div>
      </footer>
    </div>
  );
}
