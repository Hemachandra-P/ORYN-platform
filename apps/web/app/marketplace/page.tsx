"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import { apiRequest, getStoredUser } from "@/lib/api";

const CATEGORIES = [
  { id: "", label: "All" },
  { id: "furniture", label: "Furniture" },
  { id: "appliances", label: "Appliances" },
  { id: "electronics", label: "Electronics" },
  { id: "books", label: "Books" },
  { id: "bicycles", label: "Cycles" },
  { id: "kitchen", label: "Kitchen" },
];

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isMovingOut, setIsMovingOut] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => { setUser(getStoredUser()); }, []);
  useEffect(() => { fetchListings(); /* eslint-disable-next-line */ }, [category, condition, sortBy, isMovingOut]);

  const fetchListings = async (term: string = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (term) params.append("search", term);
      if (category) params.append("category", category);
      if (condition) params.append("condition", condition);
      if (sortBy) params.append("sort_by", sortBy);
      if (isMovingOut) params.append("is_moving_out_sale", "true");
      setListings(await apiRequest(`/marketplace/?${params.toString()}`));
    } catch (err) {
      console.error("Error fetching listings", err);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => { setCategory(""); setCondition(""); setSearch(""); setIsMovingOut(false); setSortBy("newest"); fetchListings(""); };
  const hasPreview = listings.some((l) => l.is_preview || l.selling_price_paise == null);
  const filtersActive = !!(category || condition || search || isMovingOut);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-navy">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Title row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">Marketplace</h1>
            <p className="mt-2 text-navy-secondary">Second-hand furniture, cycles and electronics from students near you.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/marketplace/moving-out" className="px-4 py-2.5 rounded-xl border border-navy/15 bg-white text-sm font-semibold hover:border-navy/40">Moving out sales</Link>
            {user && <Link href="/marketplace/my-listings" className="px-4 py-2.5 rounded-xl border border-navy/15 bg-white text-sm font-semibold hover:border-navy/40">My listings</Link>}
            <Link href="/marketplace/sell" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-coral"><Plus className="w-4 h-4" /> Sell an item</Link>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={(e) => { e.preventDefault(); fetchListings(); }} className="mt-8 relative" role="search">
          <Search className="w-5 h-5 text-mist-dark absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a study table, mini-fridge, cycle or textbook"
            aria-label="Search listings"
            className="w-full bg-white pl-12 pr-28 py-4 rounded-2xl border border-navy/10 text-base placeholder:text-mist-dark focus:border-coral"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(""); fetchListings(""); }} aria-label="Clear search" className="absolute right-24 top-1/2 -translate-y-1/2 p-1.5 text-mist-dark hover:text-navy"><X className="w-4 h-4" /></button>
          )}
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-coral">Search</button>
        </form>

        {/* Category tabs + filters */}
        <div className="mt-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Categories">
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <button key={c.id} role="tab" aria-selected={active} onClick={() => setCategory(c.id)} className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${active ? "text-white" : "text-navy-secondary hover:bg-white"}`}>
                  {active && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-navy" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
                  <span className="relative">{c.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={condition} onChange={(e) => setCondition(e.target.value)} aria-label="Condition" className="px-3 py-2 rounded-xl border border-navy/10 text-sm bg-white">
              <option value="">Any condition</option>
              <option value="brand_new">Brand new</option>
              <option value="like_new">Like new</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort" className="px-3 py-2 rounded-xl border border-navy/10 text-sm bg-white">
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="views">Most viewed</option>
            </select>
            <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer px-3 py-2 rounded-xl border ${isMovingOut ? "border-sun bg-sun-light" : "border-navy/10 bg-white"}`}>
              <input type="checkbox" checked={isMovingOut} onChange={(e) => setIsMovingOut(e.target.checked)} className="accent-coral" />
              Moving out only
            </label>
          </div>
        </div>

        {/* Preview-mode explainer: tells visitors why prices are hidden and how to unlock them */}
        {!loading && hasPreview && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-sun-light border border-sun/60 px-5 py-4">
            <p className="text-sm"><span className="font-semibold">You are browsing in preview.</span> Prices, photos and seller contact unlock with a ₹20 membership that lasts 6 months.</p>
            <Link href="/subscriptions" className="group inline-flex items-center gap-1.5 text-sm font-semibold shrink-0">See membership <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></Link>
          </div>
        )}

        {/* Results */}
        <div className="mt-6 flex items-center justify-between text-sm text-mist-dark" aria-live="polite">
          <span>{loading ? "Loading listings" : `${listings.length} ${listings.length === 1 ? "listing" : "listings"}`}</span>
          {filtersActive && <button onClick={clearAll} className="font-medium text-coral hover:underline">Clear filters</button>}
        </div>

        {loading ? (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-navy/10 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-paper" />
                <div className="p-5 space-y-3"><div className="h-4 bg-paper rounded w-3/4" /><div className="h-3 bg-paper rounded w-full" /><div className="h-3 bg-paper rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-4 text-center py-20 bg-white rounded-2xl border border-navy/10">
            <ShoppingBag className="w-10 h-10 mx-auto text-mist" />
            <h3 className="mt-4 font-display font-bold text-xl">Nothing matches those filters</h3>
            <p className="mt-1 text-sm text-navy-secondary">Try a different word, or clear the filters to see everything.</p>
            <button onClick={clearAll} className="mt-5 px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-coral">Clear filters</button>
          </div>
        ) : (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item, i) => <ListingCard key={item.id} item={item} index={i} />)}
          </div>
        )}
      </main>
    </div>
  );
}
