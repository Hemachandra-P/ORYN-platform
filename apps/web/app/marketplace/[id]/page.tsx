"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  ArrowLeft, Heart, MessageSquare, MapPin, Tag, ShieldCheck, 
  Sparkles, CheckCircle2, User, Share2, Check, AlertCircle, 
  Edit3, Trash2, ShoppingCart, RefreshCw
} from "lucide-react";
import { apiRequest, getStoredToken, getStoredUser } from "@/lib/api";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Modals
  const [showChatModal, setShowChatModal] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showMarkSoldModal, setShowMarkSoldModal] = useState(false);
  const [markingSold, setMarkingSold] = useState(false);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [feePreview, setFeePreview] = useState<any>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
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

  const handleDeleteListing = async () => {
    setDeleting(true);
    try {
      await apiRequest(`/marketplace/${listing.id}`, { method: "DELETE" });
      alert("Listing deleted successfully.");
      router.push("/marketplace/my-listings");
    } catch (err: any) {
      alert(err.message || "Failed to delete listing");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleMarkAsSold = async () => {
    setMarkingSold(true);
    try {
      const updated = await apiRequest(`/marketplace/${listing.id}/mark-sold`, { method: "POST" });
      setListing(updated);
      setShowMarkSoldModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to mark listing as sold");
    } finally {
      setMarkingSold(false);
    }
  };

  const handleReactivate = async () => {
    if (!confirm("Reactivate this listing so buyers can view and purchase it again?")) return;
    try {
      const updated = await apiRequest(`/marketplace/${listing.id}/reactivate`, { method: "POST" });
      setListing(updated);
      alert("Listing reactivated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to reactivate listing");
    }
  };

  const openCheckoutModal = async () => {
    const token = getStoredToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setShowCheckoutModal(true);
    setCheckoutSuccess(null);
    setFeeLoading(true);
    try {
      const preview = await apiRequest(`/marketplace/fee-preview?item_price_paise=${listing.selling_price_paise}`);
      setFeePreview(preview);
    } catch (err: any) {
      console.error(err);
    } finally {
      setFeeLoading(false);
    }
  };

  const handleCompleteProtectedPurchase = async () => {
    setCheckingOut(true);
    try {
      // 1. Create order
      const checkoutRes = await apiRequest("/marketplace/transactions/checkout", {
        method: "POST",
        body: JSON.stringify({ listing_id: listing.id }),
      });

      // 2. Simulate payment (Test Mode / Instant settlement)
      const simRes = await apiRequest("/marketplace/transactions/simulate-payment", {
        method: "POST",
        body: JSON.stringify({ order_id: checkoutRes.order_id }),
      });

      // 3. Verify payment signature
      const verifyRes = await apiRequest("/marketplace/transactions/verify", {
        method: "POST",
        body: JSON.stringify({
          order_id: checkoutRes.order_id,
          razorpay_payment_id: simRes.razorpay_payment_id,
          razorpay_signature: simRes.razorpay_signature,
        }),
      });

      setCheckoutSuccess(verifyRes.transaction);
      // Refresh listing state
      loadListing(listing.id);
    } catch (err: any) {
      alert(err.message || "Checkout failed");
    } finally {
      setCheckingOut(false);
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

  const isOwner = currentUser && currentUser.id === listing.seller_id;
  const isSold = listing.status === "sold";
  const isDeleted = listing.status === "deleted";

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-secondary hover:text-navy"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </Link>

          {isOwner && (
            <Link
              href="/marketplace/my-listings"
              className="text-xs font-bold text-coral hover:underline"
            >
              Go to My Listings &rarr;
            </Link>
          )}
        </div>

        {/* SOLD / DELETED NOTICE BANNER */}
        {isSold && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm">
                SOLD
              </span>
              <div>
                <p className="text-xs font-bold text-navy">This item was marked as SOLD.</p>
                <p className="text-[11px] text-navy-secondary">
                  New purchase enquiries and checkouts are closed for this item. Existing chats remain preserved.
                </p>
              </div>
            </div>
            {isOwner && (
              <button
                onClick={handleReactivate}
                className="px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-secondary transition-colors"
              >
                Reactivate Listing
              </button>
            )}
          </div>
        )}

        {isDeleted && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-navy">This listing has been deleted by the seller.</p>
              <p className="text-[11px] text-navy-secondary">It is hidden from public search.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: IMAGE GALLERY (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl overflow-hidden shadow-card border border-navy/5 h-[420px] sm:h-[480px] relative">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[activeImageIdx]?.image_url || listing.images[0]?.image_url}
                  alt={listing.title}
                  className={`w-full h-full object-cover ${isSold ? "grayscale-[40%]" : ""}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-mutedblue text-sm">
                  No Photograph Uploaded
                </div>
              )}

              {/* OVERLAY BADGES */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {isSold && (
                  <span className="bg-amber-500 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg tracking-wider">
                    SOLD
                  </span>
                )}
                {listing.is_moving_out_sale && (
                  <span className="bg-coral text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Moving Out / Graduation Sale
                  </span>
                )}
              </div>
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

          {/* RIGHT: DETAILS & ACTIONS (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-navy/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-coral">
                  {listing.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-cream font-bold text-navy text-xs capitalize">
                    {listing.condition?.replace("_", " ")}
                  </span>
                  {isSold && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 font-extrabold text-[10px] uppercase">
                      SOLD
                    </span>
                  )}
                </div>
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

              {/* OWNER CONTROLS vs BUYER CONTROLS */}
              {isOwner ? (
                <div className="mt-8 pt-6 border-t border-cream space-y-3">
                  <p className="text-xs font-bold text-mutedblue-dark uppercase tracking-wider">
                    Seller Listing Controls
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {!isSold ? (
                      <button
                        onClick={() => setShowMarkSoldModal(true)}
                        className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Mark as Sold
                      </button>
                    ) : (
                      <button
                        onClick={handleReactivate}
                        className="py-3 px-4 rounded-2xl bg-navy hover:bg-navy-secondary text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4" /> Reactivate
                      </button>
                    )}

                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="py-3 px-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs border border-red-200 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Listing
                    </button>
                  </div>
                  <Link
                    href={`/marketplace/my-listings?edit=${listing.id}`}
                    className="block text-center py-2.5 rounded-xl border border-navy/15 text-navy font-bold text-xs hover:bg-cream transition-colors"
                  >
                    Edit Listing Details
                  </Link>
                </div>
              ) : (
                /* BUYER ACTIONS */
                <div className="mt-8 space-y-3">
                  {isSold ? (
                    <div className="p-4 rounded-2xl bg-cream border border-navy/10 text-center">
                      <p className="text-xs font-bold text-navy">
                        This item has been marked as SOLD
                      </p>
                      <p className="text-[11px] text-mutedblue-dark mt-1">
                        New purchase enquiries and reservations are disabled for this item.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={openCheckoutModal}
                          className="flex-1 py-3.5 rounded-2xl bg-coral hover:bg-coral-hover text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" /> Buy with Protected Checkout
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

                      <button
                        onClick={() => setShowChatModal(true)}
                        className="w-full py-3 rounded-2xl bg-cream hover:bg-navy/10 text-navy font-bold text-xs border border-navy/15 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" /> Send Enquiry Message
                      </button>
                    </>
                  )}
                </div>
              )}
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
                  <p className="text-xs text-mutedblue-dark">{listing.seller?.city || "Campus Area"}</p>
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

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-elevated border border-navy/10">
            <h3 className="font-bold text-lg text-navy mb-2">Delete this listing?</h3>
            <p className="text-xs text-navy-secondary mb-4">
              This item will no longer appear in public marketplace searches. All existing audit records will be securely archived. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteListing}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MARK AS SOLD MODAL */}
      {showMarkSoldModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-elevated border border-navy/10">
            <h3 className="font-bold text-lg text-navy mb-2">Mark as SOLD?</h3>
            <p className="text-xs text-navy-secondary mb-4">
              Marking this item as sold will display a SOLD badge on the product page and disable new buyer enquiries. You can reactivate it later if needed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowMarkSoldModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsSold}
                disabled={markingSold}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md"
              >
                {markingSold ? "Updating..." : "Confirm Sold"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROTECTED CHECKOUT & TRANSACTION FEE MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-elevated border border-navy/10 animate-scaleUp">
            {checkoutSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-navy">Purchase Completed!</h3>
                <p className="text-xs text-navy-secondary">
                  Your protected marketplace transaction was successfully verified and recorded. The item has been marked as SOLD.
                </p>
                <div className="p-4 rounded-2xl bg-cream text-left text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-mutedblue-dark">Order ID:</span>
                    <span className="font-bold text-navy">{checkoutSuccess.razorpay_order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mutedblue-dark">Payment ID:</span>
                    <span className="font-bold text-navy">{checkoutSuccess.razorpay_payment_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mutedblue-dark">Total Item Price:</span>
                    <span className="font-bold text-navy">₹{(checkoutSuccess.item_price_paise / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mutedblue-dark">Buyer Fee Paid:</span>
                    <span className="font-bold text-coral">₹{(checkoutSuccess.buyer_fee_paise / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-navy/10 pt-1.5">
                    <span className="text-mutedblue-dark">Security Status:</span>
                    <span className="font-bold text-emerald-600">HMAC-SHA256 Verified</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="w-full py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-secondary"
                >
                  Close & View Details
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-extrabold text-lg text-navy">Protected Marketplace Checkout</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    Test Mode
                  </span>
                </div>

                <p className="text-xs text-navy-secondary mb-4">
                  NestSync protects community transactions. Transparent fee policies apply:
                </p>

                {feeLoading ? (
                  <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-coral border-t-transparent animate-spin"></div>
                  </div>
                ) : feePreview ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-cream/60 border border-navy/5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-navy-secondary">Item Price:</span>
                        <span className="font-bold text-navy">₹{(feePreview.item_price_paise / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-navy-secondary">
                          Marketplace Platform Fee ({feePreview.fee_policy.replace("_", " ")}):
                        </span>
                        <span className="font-bold text-coral">
                          ₹{(feePreview.buyer_fee_paise / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-navy/10 pt-2 text-sm font-black text-navy">
                        <span>Total Payable by Buyer:</span>
                        <span className="text-coral">₹{(feePreview.total_buyer_amount_paise / 100).toFixed(2)}</span>
                      </div>
                      {feePreview.seller_fee_paise > 0 && (
                        <p className="text-[10px] text-mutedblue-dark pt-1 border-t border-navy/5">
                          * Seller will contribute ₹{(feePreview.seller_fee_paise / 100).toFixed(2)} platform fee upon payout.
                        </p>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Simulated Razorpay Sandbox:</span> In development mode, completing checkout simulates cryptographic order creation and HMAC-SHA256 signature verification instantly.
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowCheckoutModal(false)}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-navy-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteProtectedPurchase}
                        disabled={checkingOut}
                        className="px-6 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                      >
                        {checkingOut ? (
                          <>
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          "Confirm & Pay"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-500">Failed to calculate fees. Please try again.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
