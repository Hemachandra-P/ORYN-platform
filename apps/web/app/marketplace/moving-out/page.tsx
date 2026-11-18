"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Sparkles, ArrowLeft, ShoppingBag, MapPin, Tag } from "lucide-react";
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
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <Navbar />

      <div className="bg-navy text-white px-4 sm:px-6 lg:px-8 py-12 border-b border-navy-secondary">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-mutedblue hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> All Marketplace Listings
          </Link>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-coral/20 text-coral">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-bold text-coral tracking-wider">
              Graduation & Relocation Showcase
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Moving Out Collections</h1>
          <p className="text-sm text-mutedblue mt-1 max-w-2xl">
            Seniors and flatmates graduating or moving flats selling entire room setups, mini-fridges, microwave ovens and study furniture at bundled student discounts.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {loading ? (
          <div className="text-center py-20 text-mutedblue-dark">Loading collections...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-card border border-navy/5">
            <Sparkles className="w-12 h-12 mx-auto text-coral mb-3 opacity-40" />
            <h3 className="font-bold text-lg text-navy">No active moving out sales</h3>
            <p className="text-xs text-navy-secondary mt-1">Check back near the end of the college semester.</p>
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
                      No Photo
                    </div>
                  )}

                  <span className="absolute top-3 left-3 bg-coral text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Moving Out Sale
                  </span>

                  <span className="absolute bottom-3 right-3 bg-navy/90 backdrop-blur-md text-white text-xs font-black px-3 py-1.5 rounded-xl">
                    ₹{(item.selling_price_paise / 100).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {item.moving_out_collection_title && (
                      <p className="text-[11px] font-bold text-coral uppercase tracking-wider mb-1">
                        {item.moving_out_collection_title}
                      </p>
                    )}
                    <h3 className="font-bold text-base text-navy line-clamp-1 group-hover:text-coral transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-navy-secondary mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-cream flex items-center justify-between text-xs text-mutedblue-dark">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-coral" />
                      {item.location}
                    </span>
                    <span className="font-bold text-navy">View Collection →</span>
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
