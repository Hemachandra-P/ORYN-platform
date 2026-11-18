"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Plus, Image as ImageIcon, Sparkles, CheckCircle2 } from "lucide-react";
import { apiRequest, getStoredToken } from "@/lib/api";

export default function SellListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("furniture");
  const [description, setDescription] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [condition, setCondition] = useState("like_new");
  const [location, setLocation] = useState("Kattankulathur / Potheri");
  const [city, setCity] = useState("Chennai");
  const [reason, setReason] = useState("");
  const [isMovingOut, setIsMovingOut] = useState(false);
  const [collectionTitle, setCollectionTitle] = useState("");
  const [imagesText, setImagesText] = useState("https://images.unsplash.com/photo-1580481077195-c3a82145d84c?w=800&auto=format&fit=crop&q=80");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pricePaise = Math.round(parseFloat(sellingPrice) * 100);
      const origPricePaise = originalPrice ? Math.round(parseFloat(originalPrice) * 100) : null;
      const imageUrls = imagesText.split("\n").map(s => s.trim()).filter(Boolean);

      const created = await apiRequest("/marketplace/", {
        method: "POST",
        body: JSON.stringify({
          title,
          category,
          description,
          selling_price_paise: pricePaise,
          original_price_paise: origPricePaise,
          condition,
          location,
          city,
          reason_for_selling: reason,
          is_moving_out_sale: isMovingOut,
          moving_out_collection_title: isMovingOut ? collectionTitle : null,
          images: imageUrls,
        }),
      });

      router.push(`/marketplace/${created.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-secondary hover:text-navy mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-elevated border border-navy/5">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">Publish a Listing</h1>
            <p className="text-xs sm:text-sm text-navy-secondary mt-1">
              List your pre-owned item for flatmates, students, and neighbors to discover.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-coral-light border border-coral/30 text-coral text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                Product Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Green Soul Ergonomic Office Chair"
                className="w-full px-4 py-3 rounded-2xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none capitalize"
                >
                  <option value="furniture">Furniture</option>
                  <option value="appliances">Appliances</option>
                  <option value="electronics">Electronics</option>
                  <option value="books">Books & Study Materials</option>
                  <option value="bicycles">Bicycles</option>
                  <option value="kitchen">Kitchen Items</option>
                  <option value="other">Other Goods</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none capitalize"
                >
                  <option value="brand_new">Brand New (Unopened / Mint)</option>
                  <option value="like_new">Like New (Barely Used)</option>
                  <option value="good">Good (Fully Functional)</option>
                  <option value="fair">Fair (Normal Wear & Tear)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                  Selling Price (₹ INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="2200.00"
                  className="w-full px-4 py-3 rounded-2xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                  Original Retail Price (Optional ₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="5999.00"
                  className="w-full px-4 py-3 rounded-2xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention dimensions, purchase date, reason for sale, and any quirks..."
                className="w-full px-4 py-3 rounded-2xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                  Pickup Location
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Skyline Heights, Potheri"
                  className="w-full px-4 py-3 rounded-2xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                Photo URLs (One per line, up to 8 images)
              </label>
              <textarea
                rows={3}
                value={imagesText}
                onChange={(e) => setImagesText(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 rounded-2xl border border-navy/15 text-xs font-mono bg-cream/30 focus:border-coral focus:outline-none"
              />
            </div>

            {/* MOVING OUT SALE TOGGLE */}
            <div className="p-4 rounded-2xl bg-cream border border-navy/10 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMovingOut}
                  onChange={(e) => setIsMovingOut(e.target.checked)}
                  className="w-5 h-5 rounded text-coral focus:ring-coral"
                />
                <div>
                  <p className="font-bold text-sm text-navy flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-coral" /> Moving Out / Graduation Sale Item
                  </p>
                  <p className="text-xs text-navy-secondary">
                    Feature this item in the graduation moving out sales showcase.
                  </p>
                </div>
              </label>

              {isMovingOut && (
                <div className="pt-2 animate-fadeIn">
                  <label className="block text-xs font-bold text-navy mb-1">
                    Collection / Bundle Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={collectionTitle}
                    onChange={(e) => setCollectionTitle(e.target.value)}
                    placeholder="e.g. Joy's B.Tech Graduation Moving Out Sale"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-xs bg-white focus:border-coral focus:outline-none"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-coral hover:bg-coral-hover text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Publishing listing..." : "Publish Listing Now"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
