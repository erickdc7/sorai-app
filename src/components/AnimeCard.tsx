"use client";

import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { AnimeCardData } from "@/types/anime";

const typeColors: Record<string, string> = {
    TV: "#6B3FA0",
    Movie: "#1565C0",
    OVA: "#2E7D32",
    Special: "#D4700A",
    ONA: "#0097A7",
    Music: "#E91E63",
};

interface AnimeCardProps {
    anime: AnimeCardData;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
    return (
        <Link href={`/anime/${anime.mal_id}`} className="group block">
            <div
                className="rounded-2xl overflow-hidden bg-white transition-all duration-300  "
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(107,63,160,0.15)")
                }
                onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)")
                }
            >
                {/* Poster */}
                <div className="relative aspect-[2/3] overflow-hidden bg-surface-alt">
                    <img
                        src={anime.image_url}
                        alt={anime.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />

                    {/* Type badge */}
                    {anime.type && (
                        <div
                            className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-white text-xs font-medium"
                            style={{
                                backgroundColor: typeColors[anime.type] || "#6B3FA0",
                            }}
                        >
                            {anime.type}
                        </div>
                    )}

                    {/* Score badge */}
                    {anime.score && (
                        <div
                            className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs"
                            style={{
                                backgroundColor: "rgba(0,0,0,0.55)",
                                backdropFilter: "blur(4px)",
                                color: "#FBBF24",
                            }}
                        >
                            <Star size={10} fill="currentColor" />
                            <span className="text-white">{anime.score}</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-3">
                    <h3
                        className="text-text-primary truncate mb-1 leading-snug text-[1.15rem] font-medium uppercase"
                        style={{ fontFamily: "var(--font-bebas-neue), sans-serif", letterSpacing: "0.01em" }}
                    >
                        {anime.title}
                    </h3>
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400 text-xs" style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>{anime.year ?? "—"}</p>
                    </div>
                </div>
            </div>
        </Link>
    );
}
