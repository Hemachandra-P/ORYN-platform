"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import { apiRequest } from "@/lib/api";

export default function MovingOutSalesPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/marketplace/?is_moving_out_sale=true")
      .then((data) => setListings(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-navy">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm font-medium text-mist-dark hover:text-navy">
          <ArrowLeft className="w-4 h-4" /> Marketplace
        </Link>

        <div className="mt-4 max-w-2xl">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">Moving out sales</h1>
          <p className="mt-3 text-navy-secondary leading-relaxed">
            Seniors and flatmates leaving the semester sell whole room setups: fridges, microwaves, desks and shelves, usually at a bundled price.
          </p>
        </div>

        {loading ? (
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => <div key={n} className="h-80 bg-white rounded-2xl border border-navy/10 animate-pulse" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-10 text-center py-20 bg-white rounded-2xl border border-navy/10">
            <Sparkles className="w-10 h-10 mx-auto text-sun" />
            <h3 className="mt-4 font-display font-bold text-xl">No moving out sales right now</h3>
            <p className="mt-1 text-sm text-navy-secondary">They usually appear towards the end of the semester.</p>
            <Link href="/marketplace/sell" className="inline-block mt-5 px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-coral">List your own room setup</Link>
          </div>
        ) : (
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item, i) => <ListingCard key={item.id} item={item} index={i} showCollection />)}
          </div>
        )}
      </main>
    </div>
  );
}
