"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  ArrowLeft, Plus, CheckCircle2, Trash2, Edit3, MessageSquare, 
  Sparkles, Tag, Eye, RefreshCw, AlertTriangle, AlertCircle, 
  X, Check, ShoppingBag, Clock
} from "lucide-react";
import { apiRequest, getStoredToken } from "@/lib/api";

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, sold, paused, draft
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [listingToDelete, setListingToDelete] = useState<any | null>(null);
  const [listingToMarkSold, setListingToMarkSold] = useState<any | null>(null);
  const [listingToEdit, setListingToEdit] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchMyListings();
  }, [statusFilter]);

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const url = statusFilter === "all" 
        ? "/marketplace/my-listings" 
        : `/marketplace/my-listings?status_filter=${statusFilter}`;
      const data = await apiRequest(url);
      setListings(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  // FEATURE 2: Delete Listing (with confirmation dialog)
  const confirmDelete = async () => {
    if (!listingToDelete) return;
    setActionLoading(true);
    try {
      await apiRequest(`/marketplace/${listingToDelete.id}`, {
        method: "DELETE",
      });
      showToast(`Listing "${listingToDelete.title}" deleted.`);
      setListingToDelete(null);
      fetchMyListings();
    } catch (err: any) {
      showToast(err.message || "Failed to delete listing");
    } finally {
      setActionLoading(false);
    }
  };

  // FEATURE 3: Mark as Sold (with confirmation)
  const confirmMarkAsSold = async () => {
    if (!listingToMarkSold) return;
    setActionLoading(true);
    try {
      await apiRequest(`/marketplace/${listingToMarkSold.id}/mark-sold`, {
        method: "POST",
      });
      showToast(`Item "${listingToMarkSold.title}" marked as SOLD.`);
      setListingToMarkSold(null);
      fetchMyListings();
    } catch (err: any) {
      showToast(err.message || "Failed to mark as sold");
    } finally {
      setActionLoading(false);
    }
  };

  // Reactivate a sold listing
  const handleReactivate = async (item: any) => {
    try {
      await apiRequest(`/marketplace/${item.id}/reactivate`, {
        method: "POST",
      });
      showToast(`Item "${item.title}" reactivated as Active.`);
      fetchMyListings();
    } catch (err: any) {
      showToast(err.message || "Failed to reactivate listing");
    }
  };

  // Edit Listing
  const openEditModal = (item: any) => {
    setListingToEdit(item);
    setEditTitle(item.title);
    setEditPrice((item.selling_price_paise / 100).toString());
    setEditDesc(item.description);
    setEditStatus(item.status);
  };

  const saveEditListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingToEdit) return;
    setActionLoading(true);
    try {
      const pricePaise = Math.round(parseFloat(editPrice) * 100);
      await apiRequest(`/marketplace/${listingToEdit.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editTitle,
          selling_price_paise: pricePaise,
          description: editDesc,
          status: editStatus,
        }),
      });
      showToast("Listing updated successfully.");
      setListingToEdit(null);
      fetchMyListings();
    } catch (err: any) {
      showToast(err.message || "Failed to update listing");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">Active</span>;
      case "sold":
        return <span className="px-2.5 py-0.5 rounded-full bg-coral text-white text-[10px] font-bold uppercase shadow-sm">SOLD</span>;
      case "paused":
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">Paused</span>;
      case "draft":
        return <span className="px-2.5 py-0.5 rounded-full bg-cream-dark text-navy text-[10px] font-bold uppercase">Draft</span>;
      case "deleted":
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">Deleted</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-cream text-navy text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <Navbar />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white px-5 py-3 rounded-2xl shadow-elevated border border-coral text-sm flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-coral" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-navy text-white px-4 sm:px-6 lg:px-8 py-10 border-b border-navy-secondary">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-mutedblue hover:text-white mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Marketplace
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">My Listings Management</h1>
            <p className="text-xs text-mutedblue mt-1">
              Manage your products, mark items as sold, view enquiry counts, and edit prices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/marketplace/sell"
              className="px-5 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create New Listing
            </Link>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="bg-white border-b border-cream-dark px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: "All My Listings" },
            { id: "active", label: "Active" },
            { id: "sold", label: "Sold" },
            { id: "paused", label: "Paused" },
            { id: "draft", label: "Drafts" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? "bg-navy text-white shadow-sm"
                  : "bg-cream/60 text-navy hover:bg-cream"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTINGS CONTAINER */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {loading ? (
          <div className="text-center py-20 text-mutedblue-dark text-sm">Loading your listings...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-card border border-navy/5">
            <ShoppingBag className="w-12 h-12 mx-auto text-mutedblue-dark mb-3 opacity-40" />
            <h3 className="font-bold text-lg text-navy">No listings found</h3>
            <p className="text-xs text-navy-secondary mt-1">You haven&apos;t created any listings matching this status.</p>
            <Link
              href="/marketplace/sell"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-coral text-white text-xs font-bold rounded-xl shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Post Your First Item
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-navy/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-elevated transition-all"
              >
                {/* Product Photo & Details */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-navy/5 shrink-0 relative">
                    {item.images?.[0] ? (
                      <img src={item.images[0].image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-mutedblue text-xs">No Img</div>
                    )}
                    {item.status === "sold" && (
                      <div className="absolute inset-0 bg-navy/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="text-[10px] font-black text-coral uppercase tracking-wider">SOLD</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(item.status)}
                      <span className="text-[11px] text-mutedblue-dark capitalize font-medium">{item.category}</span>
                      {item.is_moving_out_sale && (
                        <span className="text-[10px] bg-coral/15 text-coral font-bold px-2 py-0.5 rounded">
                          Moving Out
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/marketplace/${item.id}`}
                      className="font-bold text-base sm:text-lg text-navy hover:text-coral transition-colors line-clamp-1"
                    >
                      {item.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-mutedblue-dark mt-1">
                      <span className="font-black text-navy text-sm">
                        ₹{(item.selling_price_paise / 100).toLocaleString("en-IN")}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-mutedblue-dark" />
                        Listed {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {item.sold_at && (
                        <>
                          <span>•</span>
                          <span className="text-coral font-semibold">
                            Sold {new Date(item.sold_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1 bg-cream px-2 py-0.5 rounded font-bold text-navy text-[11px]">
                        <MessageSquare className="w-3 h-3 text-coral" />
                        {item.enquiries_count || 0} enquiry(s)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Group */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-cream">
                  {/* Mark as Sold Button */}
                  {item.status === "active" ? (
                    <button
                      onClick={() => setListingToMarkSold(item)}
                      className="px-3.5 py-2 rounded-xl bg-coral hover:bg-coral-hover text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Sold
                    </button>
                  ) : item.status === "sold" ? (
                    <button
                      onClick={() => handleReactivate(item)}
                      className="px-3 py-2 rounded-xl bg-cream hover:bg-cream-dark text-navy font-bold text-xs transition-colors flex items-center gap-1"
                      title="Reactivate this listing"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600" /> Reactivate
                    </button>
                  ) : null}

                  {/* Edit Button */}
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2.5 rounded-xl bg-cream hover:bg-cream-dark text-navy text-xs font-semibold transition-colors"
                    title="Edit Listing"
                  >
                    <Edit3 className="w-4 h-4 text-navy" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setListingToDelete(item)}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- CONFIRMATION MODALS --- */}

      {/* FEATURE 2: DELETE CONFIRMATION MODAL */}
      {listingToDelete && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-elevated border border-navy/10 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-xl text-navy mb-2">Delete this listing?</h3>
            <p className="text-xs text-navy-secondary leading-relaxed mb-6">
              You are about to delete <span className="font-bold text-navy">&quot;{listingToDelete.title}&quot;</span>. 
              Once confirmed, this item will no longer appear in marketplace searches. Past transaction and chat records will be securely archived.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setListingToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-navy-secondary hover:text-navy"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                {actionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 3: MARK AS SOLD CONFIRMATION MODAL */}
      {listingToMarkSold && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-elevated border border-navy/10 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-coral/20 text-coral flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-xl text-navy mb-2">Mark as Sold?</h3>
            <p className="text-xs text-navy-secondary leading-relaxed mb-6">
              Marking <span className="font-bold text-navy">&quot;{listingToMarkSold.title}&quot;</span> as SOLD will remove it from active marketplace searches and display a SOLD badge. New purchase enquiries will be disabled, while existing conversations will be preserved.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setListingToMarkSold(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-navy-secondary hover:text-navy"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMarkAsSold}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                {actionLoading ? "Updating..." : "Confirm Mark as Sold"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LISTING MODAL */}
      {listingToEdit && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-elevated border border-navy/10 animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl text-navy">Edit Listing</h3>
              <button onClick={() => setListingToEdit(null)} className="p-1 text-mutedblue-dark hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEditListing} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">Listing Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none capitalize font-semibold"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="draft">Draft</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream">
                <button
                  type="button"
                  onClick={() => setListingToEdit(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-navy-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
