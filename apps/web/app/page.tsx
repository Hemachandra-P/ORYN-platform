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
  const [activeAiDemo, setActiveAiDemo] = useState<number>(0);

  useEffect(() => {
    // Fetch live marketplace items
    apiRequest("/marketplace/?sort_by=newest")
      .then((data) => setFeaturedListings(data.slice(0, 3)))
      .catch((err) => console.log("Listings fetch fallback", err));
  }, []);

  const aiDemos = [
    {
      query: "Rahul paid ₹1,200 for weekly groceries. Split equally with everyone.",
      intent: "Expense Management",
      result: "Logged ₹1,200 under Groceries. Created 6 equal shares of ₹200. Sent instant notifications to all flatmates."
    },
    {
      query: "We are out of dish soap and basmati rice.",
      intent: "Collaborative Shopping List",
      result: "Added 'Dish Soap' and 'Basmati Rice' to Skyline 402 shopping list with 1 unit quantity."
    },
    {
      query: "Assign kitchen stove cleaning to Joy every Sunday.",
      intent: "Recurring Chore Scheduling",
      result: "Created weekly task 'Kitchen stove cleaning' assigned to Joy Mukherjee starting this Sunday."
    }
  ];

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
            Track flatmate bills with penny-accurate splits, automate chores with AI voice commands, and buy or sell used furniture & appliances in your community.
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
              <p className="text-3xl font-black text-navy">AI-Ready</p>
              <p className="text-xs text-mutedblue-dark font-medium mt-1">Voice & Text Action Recognition</p>
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
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-bold text-xl text-navy mb-2">AI Household Assistant</h3>
            <p className="text-sm text-navy-secondary leading-relaxed">
              Speak or type naturally: &quot;Rahul paid ₹300 for milk&quot;. AI automatically categorizes, splits, and updates your ledger safely after confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE AI ASSISTANT DEMO */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-navy text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="px-3 py-1 rounded-full bg-coral/20 text-coral font-bold text-xs uppercase tracking-wider">
              Interactive AI Assistant
            </span>
            <h2 className="text-3xl font-extrabold mt-3">Speak or text your household needs</h2>
            <p className="text-mutedblue text-sm mt-2">
              The AI never executes arbitrary commands. It structures human language into validated actions for your confirmation.
            </p>
          </div>

          <div className="bg-navy-secondary rounded-3xl p-6 sm:p-8 border border-white/10 shadow-elevated">
            <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
              {aiDemos.map((demo, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveAiDemo(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeAiDemo === idx 
                      ? "bg-coral text-white shadow-md" 
                      : "bg-navy text-mutedblue hover:text-white"
                  }`}
                >
                  Example {idx + 1}: {demo.intent}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-navy/60 p-4 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-coral/20 text-coral flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-mutedblue uppercase font-semibold tracking-wider">User Input (Text / Voice)</p>
                  <p className="text-base font-medium text-white mt-1">
                    &quot;{aiDemos[activeAiDemo].query}&quot;
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-navy/90 p-4 rounded-2xl border border-emerald-500/30">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-emerald-400 uppercase font-semibold tracking-wider">Structured Action Output</p>
                    <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      VALIDATED
                    </span>
                  </div>
                  <p className="text-sm text-cream mt-1 leading-relaxed">
                    {aiDemos[activeAiDemo].result}
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-coral">Fair & Accessible Pricing</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-navy mt-1">Simple annual subscriptions</p>
            <p className="text-navy-secondary text-sm mt-2">
              No hidden monthly fees. Every tier includes shared expense tracking so roommates can budget smoothly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white p-8 rounded-3xl shadow-card border border-navy/5 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xl text-navy">Free Community</h3>
                <p className="text-xs text-mutedblue-dark mt-1">Essential tools for students and flatmates</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-navy">₹0</span>
                  <span className="text-xs text-mutedblue-dark ml-1">/year forever</span>
                </div>
                <ul className="space-y-3 text-sm text-navy-secondary">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 1 Active Household
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Equal Expense Splitting
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Shared Shopping List & Chores
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Buy & Sell Marketplace Access
                  </li>
                </ul>
              </div>
              <Link
                href="/auth/register"
                className="mt-8 w-full py-3 rounded-xl bg-navy text-white text-center font-bold text-sm hover:bg-navy-secondary transition-all"
              >
                Join Free
              </Link>
            </div>

            {/* Basic Plus Tier (₹49) */}
            <div className="bg-white p-8 rounded-3xl shadow-elevated border-2 border-coral relative flex flex-col justify-between">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-coral text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                Most Popular
              </span>
              <div>
                <h3 className="font-bold text-xl text-navy">Basic Plus</h3>
                <p className="text-xs text-mutedblue-dark mt-1">Custom splits & recurring bill tracking</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-coral">₹49</span>
                  <span className="text-xs text-mutedblue-dark ml-1">/year</span>
                </div>
                <ul className="space-y-3 text-sm text-navy-secondary">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Up to 3 Active Households
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Custom & Percentage Expense Splits
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Recurring Bill Reminders (Electricity, Rent)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> 100 AI Voice/Text Requests / Month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" /> Priority Marketplace Listing Badge
                  </li>
                </ul>
              </div>
              <Link
                href="/subscriptions"
                className="mt-8 w-full py-3 rounded-xl bg-coral text-white text-center font-bold text-sm hover:bg-coral-hover shadow-md transition-all"
              >
                Upgrade to Basic Plus
              </Link>
            </div>

            {/* Premium Tier (₹99) */}
            <div className="bg-white p-8 rounded-3xl shadow-card border border-navy/5 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xl text-navy">Premium Lifestyle</h3>
                <p className="text-xs text-mutedblue-dark mt-1">Unlimited AI & Moving Out Bundles</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-navy">₹99</span>
                  <span className="text-xs text-mutedblue-dark ml-1">/year</span>
                </div>
                <ul className="space-y-3 text-sm text-navy-secondary">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited Households
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Moving Out Sale Bundle Collections
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited AI Voice & Text Automation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Advanced Multi-Year Spending Analytics
                  </li>
                </ul>
              </div>
              <Link
                href="/subscriptions"
                className="mt-8 w-full py-3 rounded-xl bg-navy text-white text-center font-bold text-sm hover:bg-navy-secondary transition-all"
              >
                Get Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SAMPLE TESTIMONIALS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-coral">Community Feedback</h2>
          <p className="text-3xl font-extrabold text-navy mt-1">Trusted by students & young professionals</p>
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
              &quot;The voice AI assistant understands complex splits like &apos;Rahul paid 450, split with everyone except Joy&apos;. It removes the tedious manual data entry completely.&quot;
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
