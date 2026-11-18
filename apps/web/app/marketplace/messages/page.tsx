"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  MessageSquare, Send, ArrowLeft, ShieldCheck, User, 
  ShoppingBag, CheckCircle2 
} from "lucide-react";
import { apiRequest, getStoredToken, getStoredUser } from "@/lib/api";

export default function MessagesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const user = getStoredUser();
    setCurrentUser(user);
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const convs = await apiRequest("/chat/conversations");
      setConversations(convs);
      if (convs.length > 0) {
        selectConversation(convs[0]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: any) => {
    setActiveConv(conv);
    try {
      const msgs = await apiRequest(`/chat/conversations/${conv.id}/messages`);
      setMessages(msgs);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;

    try {
      const sent = await apiRequest("/chat/messages", {
        method: "POST",
        body: JSON.stringify({
          conversation_id: activeConv.id,
          content: newMsg,
        }),
      });

      setMessages((prev) => [...prev, sent]);
      setNewMsg("");
      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id ? { ...c, last_message: sent.content, last_message_at: sent.created_at } : c
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to deliver message");
    }
  };

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/marketplace" className="p-2 rounded-xl bg-white border border-navy/10 text-navy hover:bg-cream">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-navy">Messages & Inquiries</h1>
              <p className="text-xs text-navy-secondary">Direct chats between buyers and community sellers</p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-3xl shadow-card border border-navy/5 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
          {/* CONVERSATION LIST (4 cols) */}
          <div className="md:col-span-4 border-r border-cream flex flex-col">
            <div className="p-4 border-b border-cream bg-cream-light">
              <h2 className="text-xs font-bold uppercase tracking-wider text-mutedblue-dark">Conversations</h2>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-cream">
              {conversations.length === 0 ? (
                <div className="text-center py-16 text-mutedblue-dark text-xs p-4">
                  No active inquiries yet. Message a seller on any listing.
                </div>
              ) : (
                conversations.map((c) => {
                  const otherPerson = c.buyer_id === currentUser?.id ? c.seller : c.buyer;
                  const isSelected = activeConv?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectConversation(c)}
                      className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                        isSelected ? "bg-cream/60 border-l-4 border-coral" : "hover:bg-cream/30"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-navy text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {otherPerson?.full_name?.slice(0, 2).toUpperCase() || "US"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm text-navy truncate">
                            {otherPerson?.full_name || "Community Member"}
                          </p>
                          <span className="text-[10px] text-mutedblue-dark shrink-0">
                            {new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-navy-secondary truncate mt-0.5">
                          {c.last_message || "Started a chat"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* CHAT PANE (8 cols) */}
          <div className="md:col-span-8 flex flex-col h-full">
            {activeConv ? (
              <>
                {/* Chat Header with Listing Context */}
                <div className="p-4 border-b border-cream bg-cream-light flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-coral/15 text-coral font-bold text-xs flex items-center justify-center">
                      {(activeConv.buyer_id === currentUser?.id ? activeConv.seller : activeConv.buyer)?.full_name?.slice(0, 2).toUpperCase() || "ME"}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-navy">
                        {(activeConv.buyer_id === currentUser?.id ? activeConv.seller : activeConv.buyer)?.full_name || "Community Member"}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified Flatmate / Student
                      </p>
                    </div>
                  </div>

                  {activeConv.listing && (
                    <Link
                      href={`/marketplace/${activeConv.listing.id}`}
                      className="px-3 py-1.5 rounded-xl bg-white border border-navy/10 text-xs font-bold text-navy hover:text-coral flex items-center gap-1.5 shadow-sm"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-coral" />
                      <span className="max-w-[120px] truncate">{activeConv.listing.title}</span>
                      <span>• ₹{activeConv.listing.selling_price_paise / 100}</span>
                    </Link>
                  )}
                </div>

                {/* Message Log */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-cream/20">
                  {messages.map((m) => {
                    const isMe = m.sender_id === currentUser?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? "bg-navy text-white rounded-br-none shadow-md"
                              : "bg-white text-navy border border-navy/10 rounded-bl-none shadow-sm"
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[10px] text-mutedblue-dark mt-1 px-1">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-cream bg-white flex gap-2">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-navy/15 text-sm bg-cream/30 focus:border-coral focus:outline-none text-navy"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-md transition-all flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-mutedblue-dark text-sm">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
