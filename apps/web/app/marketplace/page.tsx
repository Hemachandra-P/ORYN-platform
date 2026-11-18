"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  Search, Filter, ShoppingBag, Plus, Sparkles, Heart, 
  MapPin, Tag, ChevronDown, CheckCircle2 
} from "lucide-react";
import { apiRequest, getStoredToken } from "@/lib/api";

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isMovingOut, setIsMovingOut] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [category, condition, sortBy, isMovingOut]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (condition) params.append("condition", condition);
      if (sortBy) params.append("sort_by", sortBy);
      if (isMovingOut) params.append("is_moving_out_sale", "true");

      const data = await apiRequest(`/marketplace/?${params.toString()}`);
      setListings(data);
    } catch (err: any) {
      console.error("Error fetching listings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const categories = [
    { id: "", label: "All Items" },
    { id: "furniture", label: "Furniture" },
    { id: "appliances", label: "Appliances" },
    { id: "electronics", label: "Electronics" },
    { id: "books", label: "Books & Study" },
    { id: "bicycles", label: "Bicycles & Mobility" },
    { id: "kitchen", label: "Kitchen & Utensils" },
  ];

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <Navbar />

      {/* HEADER & SEARCH BAR */}
      <div className="bg-navy text-white px-4 sm:px-6 lg:px-8 py-10 border-b border-navy-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral/20 text-coral text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Campus Community Market
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Buy & Sell Used Essentials</h1>
              <p className="text-sm text-mutedblue mt-1">Verified student & flatmate pre-owned furniture, cycles, and electronics.</p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/marketplace/moving-out"
                className="px-4 py-2.5 rounded-xl bg-navy-secondary hover:bg-navy-secondary/80 text-white text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-coral" /> Moving Out Sales
              </Link>
              <Link
                href="/marketplace/sell"
                className="px-5 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Post a Listing
              </Link>
            </div>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-mutedblue absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search study tables, mini-fridges, cycles, textbooks..."
                className="w-full bg-navy-secondary text-white placeholder-mutedblue pl-10 pr-4 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-coral text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* CATEGORY CHIPS */}
      <div className="bg-white border-b border-cream-dark px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                category === cat.id
                  ? "bg-navy text-white shadow-sm"
                  : "bg-cream/60 text-navy hover:bg-cream"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER BAR & LISTINGS GRID */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <p className="text-xs font-semibold text-navy-secondary">
            Showing <span className="font-bold text-navy">{listings.length}</span> verified listing(s)
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {/* Condition selector */}
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-navy/15 text-xs bg-white text-navy focus:outline-none focus:border-coral"
            >
              <option value="">All Conditions</option>
              <option value="brand_new">Brand New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good Condition</option>
              <option value="fair">Fair Condition</option>
            </select>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-navy/15 text-xs bg-white text-navy focus:outline-none focus:border-coral"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="price_asc">Sort: Price (Low to High)</option>
              <option value="price_desc">Sort: Price (High to Low)</option>
              <option value="views">Sort: Most Viewed</option>
            </select>

            {/* Moving out toggle */}
            <label className="flex items-center gap-2 text-xs font-bold text-navy cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-navy/15">
              <input
                type="checkbox"
                checked={isMovingOut}
                onChange={(e) => setIsMovingOut(e.target.checked)}
                className="rounded text-coral focus:ring-coral"
              />
              Moving Out Only
            </label>
          </div>
        </div>

        {/* LISTINGS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-4 shadow-card animate-pulse h-80">
                <div className="bg-cream h-48 rounded-2xl mb-4"></div>
                <div className="h-4 bg-cream rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-cream rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-card border border-navy/5">
            <ShoppingBag className="w-12 h-12 mx-auto text-mutedblue-dark mb-3 opacity-40" />
            <h3 className="font-bold text-lg text-navy">No listings match your criteria</h3>
            <p className="text-xs text-navy-secondary mt-1">Try clearing your filters or search keywords</p>
            <button
              onClick={() => { setCategory(""); setCondition(""); setSearch(""); setIsMovingOut(false); }}
              className="mt-4 px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <Link
                key={item.id}
                href={`/marketplace/${item.id}`}
                className="bg-white rounded-3xl overflow-hidden shadow-card border border-navy/5 flex flex-col group hover:shadow-elevated hover:-translate-y-1 transition-all"
              >
                <div className="h-52 overflow-hidden relative bg-navy/5">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0].image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-mutedblue text-sm">
                      No Photo Available
                    </div>
                  )}

                  {item.is_moving_out_sale && (
                    <span className="absolute top-3 left-3 bg-coral text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Moving Out Sale
                    </span>
                  )}

                  <span className="absolute bottom-3 right-3 bg-navy/90 backdrop-blur-md text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-md">
                    ₹{(item.selling_price_paise / 100).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-mutedblue-dark mb-1.5">
                      <span className="capitalize font-semibold text-coral">{item.category}</span>
                      <span className="capitalize px-2 py-0.5 rounded bg-cream font-bold text-navy text-[10px]">
                        {item.condition?.replace("_", " ")}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-navy line-clamp-1 group-hover:text-coral transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-navy-secondary mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-cream flex items-center justify-between text-xs text-mutedblue-dark">
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <MapPin className="w-3 h-3 text-coral shrink-0" />
                      {item.location}
                    </span>
                    <span className="font-bold text-navy hover:text-coral">
                      View Item →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
