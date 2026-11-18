"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  ArrowLeft, Heart, MessageSquare, MapPin, Tag, ShieldCheck, 
  Sparkles, CheckCircle2, User, Share2 
} from "lucide-react";
import { apiRequest, getStoredToken, getStoredUser } from "@/lib/api";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    if (params?.id) {
      loadListing(params.id as string);
    }
  }, [params?.id]);

  const loadListing = async (id: string) => {
    setLoading(true);
    try {
      const data = await apiRequest(`/marketplace/${id}`);
      setListing(data);
      setIsFavorite(data.is_favorite || false);
      setInitialMessage(`Hi ${data.seller?.full_name || "Seller"}, is your "${data.title}" still available?`);
    } catch (err: any) {
      console.error("Error loading listing", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    const token = getStoredToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    try {
      const res = await apiRequest(`/marketplace/${listing.id}/favorite`, { method: "POST" });
      setIsFavorite(res.is_favorite);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setSendingMsg(true);
    try {
      await apiRequest("/chat/messages", {
        method: "POST",
        body: JSON.stringify({
          recipient_id: listing.seller_id,
          listing_id: listing.id,
          content: initialMessage,
        }),
      });
      setShowChatModal(false);
      router.push("/marketplace/messages");
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-coral border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-xl font-bold text-navy">Listing Not Found</h2>
          <Link href="/marketplace" className="mt-4 px-4 py-2 bg-coral text-white rounded-xl text-xs font-bold">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-secondary hover:text-navy mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: IMAGE GALLERY (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl overflow-hidden shadow-card border border-navy/5 h-[420px] sm:h-[480px] relative">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[activeImageIdx]?.image_url || listing.images[0]?.image_url}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-mutedblue text-sm">
                  No Photograph Uploaded
                </div>
              )}

              {listing.is_moving_out_sale && (
                <span className="absolute top-4 left-4 bg-coral text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Moving Out / Graduation Sale
                </span>
              )}
            </div>

            {/* Thumbnail selector */}
            {listing.images && listing.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {listing.images.map((img: any, idx: number) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIdx === idx ? "border-coral scale-105 shadow-md" : "border-white/50 opacity-70"
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: DETAILS & SELLER (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-navy/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-coral">
                  {listing.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-cream font-bold text-navy text-xs capitalize">
                  {listing.condition?.replace("_", " ")}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy leading-tight">
                {listing.title}
              </h1>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-navy">
                  ₹{(listing.selling_price_paise / 100).toLocaleString("en-IN")}
                </span>
                {listing.original_price_paise && (
                  <span className="text-base text-mutedblue-dark line-through font-semibold">
                    ₹{(listing.original_price_paise / 100).toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              <p className="text-xs text-mutedblue-dark flex items-center gap-1.5 mt-3">
                <MapPin className="w-3.5 h-3.5 text-coral shrink-0" />
                {listing.location}, {listing.city}
              </p>

              {listing.moving_out_collection_title && (
                <div className="mt-4 p-3 rounded-2xl bg-cream-light border border-coral/20 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-coral shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-coral tracking-wider">Part of collection</p>
                    <p className="text-xs font-bold text-navy">{listing.moving_out_collection_title}</p>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="mt-8 flex items-center gap-3">
                <button
                  onClick={() => setShowChatModal(true)}
                  className="flex-1 py-3.5 rounded-2xl bg-coral hover:bg-coral-hover text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Message Seller
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    isFavorite 
                      ? "bg-coral-light border-coral text-coral" 
                      : "bg-white border-navy/15 text-navy hover:bg-cream"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-coral" : ""}`} />
                </button>
              </div>
            </div>

            {/* SELLER CARD */}
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-mutedblue-dark mb-4">
                Seller Information
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-navy text-white font-bold text-base flex items-center justify-center">
                  {listing.seller?.full_name?.slice(0, 2).toUpperCase() || "SE"}
                </div>
                <div>
                  <h4 className="font-bold text-base text-navy flex items-center gap-1.5">
                    {listing.seller?.full_name || "Community Seller"}
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </h4>
                  <p className="text-xs text-mutedblue-dark">{listing.seller?.city || "Chennai Campus Area"}</p>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="bg-white rounded-3xl p-6 shadow-card border border-navy/5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-mutedblue-dark mb-3">
                Item Description & Reason for Selling
              </h3>
              <p className="text-sm text-navy-secondary leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
              {listing.reason_for_selling && (
                <div className="mt-4 pt-4 border-t border-cream">
                  <p className="text-xs font-bold text-navy">Reason for selling:</p>
                  <p className="text-xs text-navy-secondary mt-0.5">{listing.reason_for_selling}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGE SELLER MODAL */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-elevated border border-navy/10 animate-scaleUp">
            <h3 className="font-bold text-xl text-navy mb-1">Message Seller</h3>
            <p className="text-xs text-navy-secondary mb-4">
              Your inquiry will be sent directly to {listing.seller?.full_name || "the seller"}.
            </p>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <textarea
                rows={4}
                required
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Ask about product availability, meetup spot, or timing..."
                className="w-full px-4 py-3 rounded-2xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChatModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMsg}
                  className="px-6 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  {sendingMsg ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
