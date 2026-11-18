"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  ArrowLeft, Plus, Image as ImageIcon, Sparkles, CheckCircle2, 
  Upload, X, Star, AlertCircle, ShoppingBag, ShieldCheck 
} from "lucide-react";
import { apiRequest, getStoredToken } from "@/lib/api";

export default function SellListingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Photo uploads
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Membership status
  const [membership, setMembership] = useState<any>(null);
  const [checkingMembership, setCheckingMembership] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    checkMembershipStatus();
  }, []);

  const checkMembershipStatus = async () => {
    setCheckingMembership(true);
    try {
      const data = await apiRequest("/subscriptions/marketplace-membership");
      setMembership(data.membership);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCheckingMembership(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 8) {
      alert("Maximum 8 photographs allowed per listing.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const token = getStoredToken();
      const res = await fetch("http://localhost:8000/api/v1/marketplace/upload-images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Image upload failed");
      }

      const newUrls: string[] = await res.json();
      const fullUrls = newUrls.map(u => u.startsWith("http") ? u : `http://localhost:8000${u}`);
      setUploadedImages(prev => [...prev, ...fullUrls].slice(0, 8));
    } catch (err: any) {
      setError(err.message || "Failed to upload photographs");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const setCoverPhoto = (index: number) => {
    if (index === 0) return;
    setUploadedImages(prev => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }

    if (uploadedImages.length === 0) {
      setError("Please upload at least one photograph of the product.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pricePaise = Math.round(parseFloat(sellingPrice) * 100);
      const origPricePaise = originalPrice ? Math.round(parseFloat(originalPrice) * 100) : null;

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
          images: uploadedImages,
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
    <div className="min-h-screen bg-paper text-navy flex flex-col">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-secondary hover:text-navy mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        {/* MEMBERSHIP WARNING BANNER IF INACTIVE */}
        {!checkingMembership && membership && !membership.has_active_membership && (
          <div className="mb-6 p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-navy">Marketplace Membership Required</h4>
              <p className="text-xs text-navy-secondary mt-1">
                To publish listings and sell items, you must have an active 6-Month Marketplace Membership (₹20).
                Members can publish unlimited listings during their membership.
              </p>
              <Link
                href="/subscriptions"
                className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-coral text-white font-bold text-xs rounded-xl shadow-md"
              >
                Get Marketplace Membership for ₹20 &rarr;
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-navy/5">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-paper">
            <div>
              <h1 className="text-2xl font-black text-navy tracking-tight">Create Item Listing</h1>
              <p className="text-xs text-navy-secondary mt-1">
                Sell furniture, electronics, appliances, and study essentials to your local campus & flatmates.
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-coral/10 text-coral flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. PHOTOGRAPH UPLOAD COMPONENT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                  Product Photographs (Up to 8) *
                </label>
                <span className="text-[11px] font-bold text-mist-dark">
                  {uploadedImages.length} / 8 uploaded
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-navy/20 hover:border-coral rounded-2xl p-6 text-center cursor-pointer transition-colors bg-paper/30 hover:bg-paper/60 flex flex-col items-center justify-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-coral/10 text-coral flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-navy">
                  {uploading ? "Uploading photographs..." : "Click or tap to upload from computer or gallery"}
                </p>
                <p className="text-[10px] text-mist-dark">
                  Supports JPG, PNG, WebP up to 8 images. Click star to choose cover photo.
                </p>
              </div>

              {/* Image Previews & Ordering */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {uploadedImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className={`relative rounded-2xl overflow-hidden border-2 h-28 group ${
                        idx === 0 ? "border-coral shadow-md" : "border-navy/10"
                      }`}
                    >
                      <img src={imgUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {/* Cover Badge */}
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-coral text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow">
                          Cover Photo
                        </span>
                      )}

                      {/* Controls overlay */}
                      <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setCoverPhoto(idx); }}
                            title="Make Cover Photo"
                            className="p-1.5 rounded-full bg-white text-coral hover:scale-110 transition-transform"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                          title="Remove Photograph"
                          className="p-1.5 rounded-full bg-white text-red-600 hover:scale-110 transition-transform"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. BASIC DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Green Soul Ergonomic Office Chair"
                  className="w-full px-4 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-navy/15 text-xs text-navy bg-white focus:outline-none focus:border-coral"
                >
                  <option value="furniture">Furniture (Chairs, Tables, Beds)</option>
                  <option value="electronics">Electronics (Monitors, Keyboards)</option>
                  <option value="appliances">Appliances (Kettle, Fridge, Iron)</option>
                  <option value="kitchen">Kitchen & Cookware</option>
                  <option value="books">Books & Study Material</option>
                  <option value="study">Study Essentials</option>
                  <option value="bicycles">Bicycles & Mobility</option>
                  <option value="sports">Sports & Fitness</option>
                  <option value="home_essentials">Home Essentials</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* 3. PRICE & CONDITION */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="e.g. 2200"
                  className="w-full px-4 py-2.5 rounded-xl border border-navy/15 text-xs text-navy font-bold focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                  Original Price (Optional ₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="e.g. 5999"
                  className="w-full px-4 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                  Condition *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-navy/15 text-xs text-navy bg-white focus:outline-none focus:border-coral"
                >
                  <option value="brand_new">Brand New (Unopened/Unused)</option>
                  <option value="like_new">Like New (Barely Used, Mint)</option>
                  <option value="good">Good (Lightly Used)</option>
                  <option value="fair">Fair (Normal Wear & Tear)</option>
                </select>
              </div>
            </div>

            {/* 4. LOCATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                  Pickup Location / Campus Spot *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Estancia Tower 2 or Potheri"
                  className="w-full px-4 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:outline-none focus:border-coral"
                />
              </div>
            </div>

            {/* 5. DESCRIPTION */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                Description & Specifications *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe condition, dimensions, how long it was used, and pickup timing..."
                className="w-full px-4 py-3 rounded-2xl border border-navy/15 text-xs text-navy focus:outline-none focus:border-coral"
              />
            </div>

            {/* 6. REASON & MOVING OUT SALE */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
                Reason for Selling (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Graduating SRM in May, moving to Bangalore"
                className="w-full px-4 py-2.5 rounded-xl border border-navy/15 text-xs text-navy focus:outline-none focus:border-coral"
              />
            </div>

            {/* MOVING OUT COLLECTION TOGGLE */}
            <div className="p-4 rounded-2xl bg-paper/40 border border-coral/20">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMovingOut}
                  onChange={(e) => setIsMovingOut(e.target.checked)}
                  className="w-4 h-4 text-coral rounded border-navy/20 focus:ring-coral"
                />
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-coral" /> Mark as part of a Moving Out / Graduation Sale
                </span>
              </label>

              {isMovingOut && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={collectionTitle}
                    onChange={(e) => setCollectionTitle(e.target.value)}
                    placeholder="Collection name (e.g. 4th Year B.Tech Flat Clearance)"
                    className="w-full px-3 py-2 rounded-xl border border-navy/15 text-xs text-navy focus:outline-none focus:border-coral bg-white"
                  />
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Link
                href="/marketplace"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-navy-secondary hover:text-navy"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading || uploading || (membership && !membership.has_active_membership)}
                className="px-8 py-3 rounded-2xl bg-coral hover:bg-coral-hover disabled:bg-gray-400 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                {loading ? "Publishing..." : "Publish Listing"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
