"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, MapPin, ImageOff } from "lucide-react";

const CONDITION: Record<string, string> = { brand_new: "Brand new", like_new: "Like new", good: "Good", fair: "Fair" };

/** One listing tile, used by the marketplace and moving-out pages. */
export default function ListingCard({ item, index = 0, showCollection = false }: { item: any; index?: number; showCollection?: boolean }) {
  const reduce = useReducedMotion();
  const isPreview = item.is_preview || item.selling_price_paise == null;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <Link href={`/marketplace/${item.id}`} className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-navy/10 hover:border-navy/25 hover:shadow-elevated hover:-translate-y-1">
        <div className="aspect-[4/3] relative overflow-hidden bg-paper">
          {item.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.images[0].image_url} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-mist-dark">
              <ImageOff className="w-6 h-6" />
              <span className="text-xs">No photo yet</span>
            </div>
          )}
          {item.is_moving_out_sale && <span className="absolute top-3 left-3 bg-sun text-navy text-xs font-semibold px-2.5 py-1 rounded-md">Moving out sale</span>}
        </div>

        <div className="p-5 flex-1 flex flex-col">
          {showCollection && item.moving_out_collection_title && <p className="text-xs font-semibold text-coral mb-1">{item.moving_out_collection_title}</p>}
          {!isPreview && (
            <p className="text-xs text-mist-dark mb-1.5 capitalize">
              {item.category}{item.condition ? ` · ${CONDITION[item.condition] || item.condition.replace("_", " ")}` : ""}
            </p>
          )}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display font-bold text-lg leading-snug line-clamp-2 group-hover:text-coral transition-colors">{item.title}</h3>
            {!isPreview && <span className="font-mono font-semibold tabular shrink-0 pt-0.5">₹{(item.selling_price_paise / 100).toLocaleString("en-IN")}</span>}
          </div>
          <p className="mt-1.5 text-sm text-navy-secondary line-clamp-2 leading-relaxed">{item.description}</p>

          <div className="mt-auto pt-4 flex items-center justify-between text-xs text-mist-dark">
            <span className="truncate">{item.seller?.full_name || "Community seller"}</span>
            {isPreview ? (
              <span className="inline-flex items-center gap-1 font-medium text-navy-secondary shrink-0"><Lock className="w-3 h-3" /> Price for members</span>
            ) : (
              item.location && <span className="inline-flex items-center gap-1 shrink-0"><MapPin className="w-3 h-3" />{item.location}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
